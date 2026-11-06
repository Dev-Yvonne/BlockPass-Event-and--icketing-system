import { Types } from "mongoose";
import Booking, { IBooking } from "../models/Booking";
import Event from "../models/Event";
import {
  LocalPaymentProvider,
  PaymentMethod,
  quoteLocal,
  sandboxProvider,
} from "./payments";
import { STABLECOIN_CODE } from "./stellar/config";
import { AppError } from "../utils/AppError";
import { maskEmail, logMint } from "./mintLogger";
import { ensureAttendeeWallet, ensureEventIssuer } from "./stellar/provisioning";
import { buildAssetCode, MAX_SERIAL, mintTickets } from "./stellar/ticketAssets";

export const MAX_TICKETS_PER_ORDER = 10;

const localProvider: LocalPaymentProvider = sandboxProvider;

export interface CheckoutInput {
  eventId: string;
  tierId: string;
  name: string;
  email: string;
  quantity: number;
  checkoutId: string;
  paymentMethod: PaymentMethod;
  currency?: string;
  phone?: string;
  userId?: Types.ObjectId;
}

async function findExisting(checkoutId: string) {
  return Booking.findOne({ checkoutId });
}

/**
 * Reserves tickets and serials in one atomic update, so concurrent checkouts
 * can neither oversell a tier nor be handed the same serial.
 */
async function reserve(input: CheckoutInput) {
  const tierId = new Types.ObjectId(input.tierId);
  const event = await Event.findOneAndUpdate(
    {
      _id: input.eventId,
      date: { $gt: new Date() },
      tiers: { $elemMatch: { _id: tierId, remaining: { $gte: input.quantity } } },
      "ticketing.nextSerial": { $lte: MAX_SERIAL - input.quantity },
    },
    {
      $inc: {
        "tiers.$.remaining": -input.quantity,
        ticketsSold: input.quantity,
        "ticketing.nextSerial": input.quantity,
      },
    },
    { new: true }
  );
  if (!event) return null;

  const tier = event.tiers.id(tierId)!;
  const lastSerial = event.ticketing.nextSerial;
  const serials = Array.from(
    { length: input.quantity },
    (_, i) => lastSerial - input.quantity + 1 + i
  );
  return { event, tier, serials };
}

async function release(eventId: Types.ObjectId, tierId: Types.ObjectId, quantity: number) {
  // Serials are left unused rather than recycled: gaps are harmless, a reused
  // serial is not.
  await Event.updateOne(
    { _id: eventId, "tiers._id": tierId },
    { $inc: { "tiers.$.remaining": quantity, ticketsSold: -quantity } }
  );
}

/** Runs one order from form submission to a confirmed on-chain mint. */
export async function checkout(input: CheckoutInput): Promise<IBooking> {
  const existing = await findExisting(input.checkoutId);
  if (existing) return existing;

  const event = await Event.findById(input.eventId);
  if (!event || event.hidden) throw new AppError("Event not found", 404);
  if (event.date <= new Date()) throw new AppError("This event has already taken place", 409);
  if (!event.tiers.id(input.tierId)) throw new AppError("Ticket tier not found", 404);

  // Provision before reserving: a funding failure shouldn't hold inventory.
  const issuer = await ensureEventIssuer(event);

  const reservation = await reserve(input);
  if (!reservation) throw new AppError("Not enough tickets remaining in this tier", 409);

  const { tier, serials } = reservation;
  const eventCode = reservation.event.ticketing.eventCode!;
  const assetCodes = serials.map((s) => buildAssetCode(eventCode, tier.name, s));

  const totalPrice = Number((tier.price * input.quantity).toFixed(2));
  const payment =
    input.paymentMethod === "local"
      ? {
          method: "local" as const,
          currency: input.currency!,
          ...quoteLocal(totalPrice, input.currency!),
          provider: localProvider.name,
        }
      : {
          method: "stablecoin" as const,
          currency: STABLECOIN_CODE,
          amount: totalPrice,
          provider: "stellar-testnet",
        };

  let booking: IBooking;
  try {
    booking = await Booking.create({
      user: input.userId,
      event: event._id,
      attendeeName: input.name,
      attendeeEmail: input.email,
      checkoutId: input.checkoutId,
      tierId: tier._id,
      tierName: tier.name,
      quantity: input.quantity,
      totalPrice,
      stellar: { issuer: issuer.publicKey() },
      payment,
    });
  } catch (err) {
    await release(event._id, tier._id, input.quantity);
    if ((err as { code?: number }).code === 11000) {
      const winner = await findExisting(input.checkoutId);
      if (winner) return winner;
    }
    throw err;
  }

  const logBase = {
    reference: booking.ticketCode,
    eventTitle: event.title,
    tierName: tier.name,
    quantity: input.quantity,
    assetCodes,
    issuer: issuer.publicKey(),
  };
  await logMint({ ...logBase, stage: "order.received", attendee: maskEmail(input.email) });

  try {
    if (payment.method === "local" && payment.amount > 0) {
      const { providerReference } = await localProvider.charge({
        amount: payment.amount,
        currency: payment.currency,
        phone: input.phone!,
        reference: booking.ticketCode,
      });
      booking.payment.reference = providerReference;
      booking.payment.status = "paid";
    }

    const attendee = await ensureAttendeeWallet(input.email);
    booking.stellar.attendeePublicKey = attendee.publicKey();
    await logMint({
      ...logBase,
      stage: "mint.submitted",
      attendeePublicKey: attendee.publicKey(),
    });

    const { txHash, ledger } = await mintTickets({
      reference: booking.ticketCode,
      assetCodes,
      issuer,
      attendee,
      stablecoinAmount:
        payment.method === "stablecoin" && totalPrice > 0 ? totalPrice.toFixed(2) : undefined,
    });

    if (payment.method === "stablecoin") booking.payment.reference = txHash;
    booking.payment.status = "paid";
    booking.status = "confirmed";
    booking.tickets = serials.map((serial, i) => ({ serial, assetCode: assetCodes[i] }));
    booking.stellar.txHash = txHash;
    booking.stellar.ledger = ledger;
    await booking.save();

    await logMint({
      ...logBase,
      stage: "mint.confirmed",
      attendeePublicKey: attendee.publicKey(),
      txHash,
      ledger,
    });
    return booking;
  } catch (err) {
    const message = (err as Error).message;
    booking.status = "failed";
    booking.failureReason = message;
    // A local charge that succeeded before the mint failed goes back to the buyer.
    if (booking.payment.status === "paid" && booking.payment.reference) {
      await localProvider.refund(booking.payment.reference);
      booking.payment.status = "refunded";
    } else {
      booking.payment.status = "failed";
    }
    await booking.save();
    await release(event._id, tier._id, input.quantity);
    await logMint({ ...logBase, stage: "mint.failed", error: message });
    return booking;
  }
}
