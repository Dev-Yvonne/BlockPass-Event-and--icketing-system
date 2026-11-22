import { Keypair } from "@stellar/stellar-sdk";
import { Types } from "mongoose";
import AttendeeWallet from "../models/AttendeeWallet";
import Booking, { IBooking, IMintedTicket } from "../models/Booking";
import Event, { IEvent } from "../models/Event";
import { IUser } from "../models/User";
import { ScanVerdict } from "../models/ScanLog";
import { AppError } from "../utils/AppError";
import { decryptSecret } from "../utils/walletCrypto";
import { verifyPassToken } from "./passes/passToken";
import { logScan } from "./scanLogger";
import { explorer, getPassSigningKeypair, getVaultKeypair } from "./stellar/config";
import { findConfirmedTransaction, redeemTicketOnChain, ticketHolding } from "./stellar/redemption";

/** A settle attempt that started this long ago without finishing is treated as dropped. */
const STALE_ATTEMPT_MS = 20_000;
const MAX_SETTLE_ATTEMPTS = 5;

export type InvalidReason =
  | "not_a_pass"
  | "bad_signature"
  | "expired"
  | "not_found"
  | "wrong_event"
  | "not_on_ledger";

const INVALID_MESSAGES: Record<InvalidReason, string> = {
  not_a_pass: "This isn't a BlockPass ticket code.",
  bad_signature: "This code wasn't issued by BlockPass. It may be forged or edited.",
  expired: "This code has expired. Ask the attendee to open their live pass.",
  not_found: "No ticket matches this code.",
  wrong_event: "This ticket is for a different event.",
  not_on_ledger: "The attendee's wallet doesn't hold this ticket on Stellar.",
};

export interface ScanTicketInfo {
  bookingId: string;
  serial: number;
  assetCode: string;
  attendeeName: string;
  tierName: string;
  eventTitle: string;
  mintTxUrl: string | null;
  assetUrl: string | null;
}

export interface RedemptionView {
  status: "redeeming" | "redeemed" | "failed";
  admittedAt: Date;
  txHash: string | null;
  txUrl: string | null;
  ledger: number | null;
  confirmedAt: Date | null;
}

export interface ScanResult {
  verdict: ScanVerdict;
  reason?: InvalidReason;
  message: string;
  /** How the verdict was reached: from the database lock or the ledger itself. */
  source?: "database" | "ledger";
  latencyMs: number;
  ticket?: ScanTicketInfo;
  redemption?: RedemptionView;
}

export function toRedemptionView(ticket: IMintedTicket): RedemptionView | null {
  const r = ticket.redemption;
  if (!r?.status) return null;
  return {
    status: r.status,
    admittedAt: r.admittedAt,
    txHash: r.txHash ?? null,
    txUrl: r.txHash ? explorer.tx(r.txHash) : null,
    ledger: r.ledger ?? null,
    confirmedAt: r.confirmedAt ?? null,
  };
}

function ticketInfo(booking: IBooking, ticket: IMintedTicket, event: IEvent): ScanTicketInfo {
  const issuer = booking.stellar.issuer;
  return {
    bookingId: booking._id.toString(),
    serial: ticket.serial,
    assetCode: ticket.assetCode,
    attendeeName: booking.attendeeName,
    tierName: booking.tierName,
    eventTitle: event.title,
    mintTxUrl: booking.stellar.txHash ? explorer.tx(booking.stellar.txHash) : null,
    assetUrl: issuer ? explorer.asset(ticket.assetCode, issuer) : null,
  };
}

/** Organizers scan only their own events; admins can scan any. */
export async function loadScannableEvent(eventId: string, user: IUser): Promise<IEvent> {
  if (!Types.ObjectId.isValid(eventId)) throw new AppError("Choose an event to scan for", 400);
  const event = await Event.findById(eventId);
  if (!event) throw new AppError("Event not found", 404);
  if (user.role !== "admin" && event.organizer.toString() !== user._id.toString()) {
    throw new AppError("You can only scan tickets for your own events", 403);
  }
  return event;
}

export async function scanTicket(params: {
  token: string;
  eventId: string;
  user: IUser;
}): Promise<ScanResult> {
  const started = Date.now();
  const { user } = params;

  // The signature check needs no I/O, so the event and ticket load side by side.
  const checked = verifyPassToken(params.token, getPassSigningKeypair());
  const [event, booking] = await Promise.all([
    loadScannableEvent(params.eventId, user),
    checked.ok ? Booking.findById(checked.payload.b) : Promise.resolve(null),
  ]);
  const base = { event: event._id, eventTitle: event.title, scannedBy: user._id };

  const finish = async (result: Omit<ScanResult, "latencyMs">, extra: Record<string, unknown> = {}) => {
    const full: ScanResult = { ...result, latencyMs: Date.now() - started };
    await logScan({
      stage: "scan.verdict",
      ...base,
      verdict: full.verdict,
      reason: full.reason ?? (full.source ? `source:${full.source}` : undefined),
      latencyMs: full.latencyMs,
      booking: full.ticket ? new Types.ObjectId(full.ticket.bookingId) : undefined,
      serial: full.ticket?.serial,
      assetCode: full.ticket?.assetCode,
      ...extra,
    });
    return full;
  };
  const invalid = (reason: InvalidReason, ticket?: ScanTicketInfo) =>
    finish({ verdict: "invalid", reason, message: INVALID_MESSAGES[reason], ticket });

  if (!checked.ok) {
    return invalid(checked.reason === "malformed" ? "not_a_pass" : checked.reason);
  }
  const { s: serial } = checked.payload;

  const ticket = booking?.tickets.find((t) => t.serial === serial);
  if (!booking || !ticket || booking.status !== "confirmed") return invalid("not_found");

  const info = ticketInfo(booking, ticket, event);
  if (booking.event.toString() !== event._id.toString()) return invalid("wrong_event", info);

  const already = (source: "database" | "ledger", view: RedemptionView | null) =>
    finish({
      verdict: "already_redeemed",
      source,
      message:
        source === "ledger"
          ? "The Stellar ledger shows this ticket is already in the redeemed vault."
          : "This ticket has already been used to enter.",
      ticket: info,
      redemption: view ?? undefined,
    });

  if (ticket.redemption?.status) return already("database", toRedemptionView(ticket));

  const issuer = booking.stellar.issuer;
  const holder = booking.stellar.attendeePublicKey;
  if (!issuer || !holder) return invalid("not_on_ledger", info);

  // Two checks at once: exactly one scan can win the database claim, however
  // many arrive together, and the ledger must show the attendee holds the
  // ticket right now. A claim the ledger disagrees with is released.
  const admittedAt = new Date();
  const [claim, holding] = await Promise.all([
    Booking.updateOne(
      { _id: booking._id, tickets: { $elemMatch: { serial, "redemption.status": { $exists: false } } } },
      {
        $set: {
          "tickets.$.redemption": { status: "redeeming", admittedAt, scannedBy: user._id, attempts: 0 },
        },
      }
    ),
    ticketHolding(holder, ticket.assetCode, issuer),
  ]);

  if (holding === "not_held") {
    if (claim.modifiedCount === 1) {
      await Booking.updateOne(
        { _id: booking._id, "tickets.serial": serial },
        { $unset: { "tickets.$.redemption": "" } }
      );
    }
    const inVault = await ticketHolding(getVaultKeypair().publicKey(), ticket.assetCode, issuer);
    return inVault === "held" ? already("ledger", null) : invalid("not_on_ledger", info);
  }
  if (claim.modifiedCount !== 1) {
    const fresh = await Booking.findById(booking._id);
    const now = fresh?.tickets.find((t) => t.serial === serial);
    return already("database", now ? toRedemptionView(now) : null);
  }

  return finish(
    {
      verdict: "valid",
      source: "ledger",
      message: "Signature and Stellar ownership verified.",
      ticket: info,
      redemption: {
        status: "redeeming",
        admittedAt,
        txHash: null,
        txUrl: null,
        ledger: null,
        confirmedAt: null,
      },
    },
    { attendeePublicKey: holder }
  );
}

async function markRedeemed(bookingId: Types.ObjectId, serial: number, txHash: string | undefined, ledger?: number) {
  await Booking.updateOne(
    { _id: bookingId, "tickets.serial": serial },
    {
      $set: {
        "tickets.$.redemption.status": "redeemed",
        "tickets.$.redemption.txHash": txHash,
        "tickets.$.redemption.ledger": ledger,
        "tickets.$.redemption.confirmedAt": new Date(),
      },
      $unset: { "tickets.$.redemption.error": "" },
    }
  );
}

/**
 * Moves an admitted ticket to the vault on Stellar. Safe to call repeatedly
 * and from several places: only one attempt runs at a time, and each attempt
 * first checks whether an earlier one already landed.
 */
export async function settleRedemption(bookingId: string, serial: number): Promise<RedemptionView | null> {
  const booking = await Booking.findById(bookingId).populate<{ event: IEvent }>("event");
  const ticket = booking?.tickets.find((t) => t.serial === serial);
  if (!booking || !ticket?.redemption?.status) return null;
  if (ticket.redemption.status === "redeemed") return toRedemptionView(ticket);
  if ((ticket.redemption.attempts ?? 0) >= MAX_SETTLE_ATTEMPTS) return toRedemptionView(ticket);

  const staleBefore = new Date(Date.now() - STALE_ATTEMPT_MS);
  const lock = await Booking.updateOne(
    {
      _id: booking._id,
      tickets: {
        $elemMatch: {
          serial,
          "redemption.status": { $in: ["redeeming", "failed"] },
          $or: [
            { "redemption.lastAttemptAt": { $exists: false } },
            { "redemption.lastAttemptAt": { $lt: staleBefore } },
          ],
        },
      },
    },
    { $set: { "tickets.$.redemption.lastAttemptAt": new Date() }, $inc: { "tickets.$.redemption.attempts": 1 } }
  );
  if (lock.modifiedCount !== 1) return toRedemptionView(ticket);

  const issuer = booking.stellar.issuer!;
  const holder = booking.stellar.attendeePublicKey!;
  const base = {
    event: booking.event._id,
    eventTitle: booking.event.title,
    booking: booking._id,
    serial,
    assetCode: ticket.assetCode,
    attendeePublicKey: holder,
  };

  try {
    const pending = ticket.redemption.pendingTxHash;
    const landed = pending ? await findConfirmedTransaction(pending) : null;
    if (landed) {
      await markRedeemed(booking._id, serial, landed.txHash, landed.ledger);
      await logScan({ stage: "redeem.confirmed", ...base, ...landed });
    } else if ((await ticketHolding(holder, ticket.assetCode, issuer)) === "not_held") {
      // Already moved by an attempt we lost track of: the vault holding it is the proof.
      const inVault = await ticketHolding(getVaultKeypair().publicKey(), ticket.assetCode, issuer);
      if (inVault !== "held") throw new AppError("The ticket left the attendee's wallet but isn't in the vault", 409);
      await markRedeemed(booking._id, serial, pending);
      await logScan({ stage: "redeem.confirmed", ...base, txHash: pending });
    } else {
      const wallet = await AttendeeWallet.findOne({ email: booking.attendeeEmail }).select("+encryptedSecret");
      if (!wallet) throw new AppError("Attendee wallet not found", 500);
      const attendee = Keypair.fromSecret(decryptSecret(wallet.encryptedSecret));

      const result = await redeemTicketOnChain({
        assetCode: ticket.assetCode,
        issuerPublicKey: issuer,
        attendee,
        onBuilt: async (hash) => {
          await Booking.updateOne(
            { _id: booking._id, "tickets.serial": serial },
            { $set: { "tickets.$.redemption.pendingTxHash": hash } }
          );
          await logScan({ stage: "redeem.submitted", ...base, txHash: hash });
        },
      });
      await markRedeemed(booking._id, serial, result.txHash, result.ledger);
      await logScan({ stage: "redeem.confirmed", ...base, ...result });
    }
  } catch (err) {
    const message = (err as Error).message;
    await Booking.updateOne(
      { _id: booking._id, "tickets.serial": serial },
      { $set: { "tickets.$.redemption.status": "failed", "tickets.$.redemption.error": message } }
    );
    await logScan({ stage: "redeem.failed", ...base, error: message });
  }

  const fresh = await Booking.findById(booking._id);
  const now = fresh?.tickets.find((t) => t.serial === serial);
  return now ? toRedemptionView(now) : null;
}

/** Finishes any check-in whose on-chain step was interrupted, for example by a closed scanner. */
export async function resumeStaleRedemptions(booking: IBooking): Promise<boolean> {
  const staleBefore = Date.now() - STALE_ATTEMPT_MS;
  const stale = booking.tickets.filter((t) => {
    const r = t.redemption;
    if (!r?.status || r.status === "redeemed" || (r.attempts ?? 0) >= MAX_SETTLE_ATTEMPTS) return false;
    const last = (r.lastAttemptAt ?? r.admittedAt)?.getTime() ?? 0;
    return last < staleBefore;
  });
  for (const t of stale) await settleRedemption(booking._id.toString(), t.serial);
  return stale.length > 0;
}
