import { Request, Response } from "express";
import { Types } from "mongoose";
import Booking, { IBooking } from "../models/Booking";
import { IEvent } from "../models/Event";
import MintLog from "../models/MintLog";
import { checkout, MAX_TICKETS_PER_ORDER } from "../services/checkout";
import { LOCAL_RATES, PaymentMethod } from "../services/payments";
import { maskEmail } from "../services/mintLogger";
import { explorer, STABLECOIN_CODE } from "../services/stellar/config";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{9,15}$/;
const LEDGER_PAGE_SIZE = 50;

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(`${field} is required`, 400);
  }
  return value.trim();
}

/** The public view of an order: anyone holding the reference can open it. */
export function toOrderResponse(booking: IBooking, event: IEvent) {
  const { issuer, attendeePublicKey, txHash, ledger } = booking.stellar;
  return {
    reference: booking.ticketCode,
    status: booking.status,
    attendeeName: booking.attendeeName,
    attendeeEmail: maskEmail(booking.attendeeEmail),
    tierName: booking.tierName,
    quantity: booking.quantity,
    totalPrice: booking.totalPrice,
    createdAt: booking.createdAt,
    event: {
      id: event._id,
      title: event.title,
      date: event.date,
      venue: event.venue,
      imageUrl: event.imageUrl,
    },
    payment: {
      method: booking.payment.method,
      currency: booking.payment.currency,
      amount: booking.payment.amount,
      provider: booking.payment.provider,
      reference: booking.payment.reference,
      status: booking.payment.status,
    },
    tickets: booking.tickets.map(({ serial, assetCode }) => ({
      serial,
      assetCode,
      explorerUrl: issuer ? explorer.asset(assetCode, issuer) : null,
    })),
    stellar: {
      network: "testnet",
      txHash: txHash ?? null,
      ledger: ledger ?? null,
      txUrl: txHash ? explorer.tx(txHash) : null,
      issuer: issuer ?? null,
      issuerUrl: issuer ? explorer.account(issuer) : null,
      attendeePublicKey: attendeePublicKey ?? null,
      attendeeUrl: attendeePublicKey ? explorer.account(attendeePublicKey) : null,
    },
  };
}

export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const eventId = requireString(req.body.eventId, "eventId");
  const tierId = requireString(req.body.tierId, "tierId");
  const checkoutId = requireString(req.body.checkoutId, "checkoutId");
  const name = requireString(req.body.name, "Name");
  const email = requireString(req.body.email, "Email").toLowerCase();
  const quantity = Number(req.body.quantity);

  if (!Types.ObjectId.isValid(eventId)) throw new AppError("Event not found", 404);
  if (!Types.ObjectId.isValid(tierId)) throw new AppError("Ticket tier not found", 404);
  if (name.length > 80) throw new AppError("Name is too long", 400);
  if (checkoutId.length > 64) throw new AppError("checkoutId is too long", 400);
  if (!EMAIL_PATTERN.test(email)) throw new AppError("Enter a valid email address", 400);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_ORDER) {
    throw new AppError(`Quantity must be between 1 and ${MAX_TICKETS_PER_ORDER}`, 400);
  }

  const paymentMethod = req.body.paymentMethod as PaymentMethod;
  if (paymentMethod !== "stablecoin" && paymentMethod !== "local") {
    throw new AppError("Choose a payment method", 400);
  }
  const currency = String(req.body.currency ?? "");
  const phone = String(req.body.phone ?? "").replace(/[\s-]/g, "");
  if (paymentMethod === "local") {
    if (!LOCAL_RATES[currency]) throw new AppError("That currency isn't supported", 400);
    if (!PHONE_PATTERN.test(phone)) throw new AppError("Enter a valid mobile money number", 400);
  }

  const booking = await checkout({
    eventId,
    tierId,
    name,
    email,
    quantity,
    checkoutId,
    paymentMethod,
    currency,
    phone,
    userId: req.user?._id,
  });

  const populated = await booking.populate<{ event: IEvent }>("event");
  const order = toOrderResponse(populated as unknown as IBooking, populated.event);
  res.status(booking.status === "failed" ? 502 : 201).json(order);
});

export const getCheckoutOptions = (_req: Request, res: Response) => {
  res.json({ stablecoin: STABLECOIN_CODE, rates: LOCAL_RATES });
};

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findOne({ ticketCode: String(req.params.reference) }).populate<{
    event: IEvent;
  }>("event");
  if (!booking) throw new AppError("Order not found", 404);
  res.json(toOrderResponse(booking as unknown as IBooking, booking.event));
});

/** Recent confirmed mints, with attendee details left out, for the public ledger page. */
export const listMints = asyncHandler(async (_req: Request, res: Response) => {
  const mints = await MintLog.find({ stage: "mint.confirmed" })
    .sort({ createdAt: -1 })
    .limit(LEDGER_PAGE_SIZE)
    .lean();

  res.json(
    mints.map((mint) => ({
      reference: mint.reference,
      eventTitle: mint.eventTitle,
      tierName: mint.tierName,
      quantity: mint.quantity,
      assetCodes: mint.assetCodes,
      txHash: mint.txHash,
      txUrl: mint.txHash ? explorer.tx(mint.txHash) : null,
      ledger: mint.ledger,
      createdAt: mint.createdAt,
    }))
  );
});
