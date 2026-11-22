import { Request, Response } from "express";
import { Types } from "mongoose";
import Booking from "../models/Booking";
import Event from "../models/Event";
import ScanLog from "../models/ScanLog";
import { loadScannableEvent, scanTicket, settleRedemption, toRedemptionView } from "../services/gate";
import { explorer, getVaultKeypair } from "../services/stellar/config";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const LOG_PAGE_SIZE = 50;
const MAX_LOG_PAGE_SIZE = 200;

/** Events this person can scan for, with check-in progress. */
export const listGateEvents = asyncHandler(async (req: Request, res: Response) => {
  const filter = req.user!.role === "admin" ? {} : { organizer: req.user!._id };
  const events = await Event.find(filter).sort({ date: 1 }).lean();
  const ids = events.map((e) => e._id);

  const counts = await Booking.aggregate<{ _id: Types.ObjectId; issued: number; checkedIn: number }>([
    { $match: { event: { $in: ids }, status: "confirmed" } },
    { $unwind: "$tickets" },
    {
      $group: {
        _id: "$event",
        issued: { $sum: 1 },
        checkedIn: { $sum: { $cond: [{ $ifNull: ["$tickets.redemption.status", false] }, 1, 0] } },
      },
    },
  ]);
  const byEvent = new Map(counts.map((c) => [c._id.toString(), c]));

  res.json({
    vault: { publicKey: getVaultKeypair().publicKey(), url: explorer.account(getVaultKeypair().publicKey()) },
    events: events.map((e) => ({
      id: e._id,
      title: e.title,
      date: e.date,
      venue: e.venue,
      issued: byEvent.get(e._id.toString())?.issued ?? 0,
      checkedIn: byEvent.get(e._id.toString())?.checkedIn ?? 0,
    })),
  });
});

export const scan = asyncHandler(async (req: Request, res: Response) => {
  const token = typeof req.body.token === "string" ? req.body.token.slice(0, 2000) : "";
  res.json(await scanTicket({ token, eventId: String(req.body.eventId ?? ""), user: req.user! }));
});

async function loadTicketForStaff(req: Request) {
  const { bookingId } = req.params;
  const serial = Number(req.params.serial);
  if (!Types.ObjectId.isValid(bookingId)) throw new AppError("Ticket not found", 404);
  const booking = await Booking.findById(bookingId);
  const ticket = booking?.tickets.find((t) => t.serial === serial);
  if (!booking || !ticket) throw new AppError("Ticket not found", 404);
  await loadScannableEvent(booking.event.toString(), req.user!);
  return { booking, ticket, serial };
}

/** Runs the on-chain step for an admitted ticket and waits for Stellar to confirm it. */
export const confirmRedemption = asyncHandler(async (req: Request, res: Response) => {
  const { booking, serial } = await loadTicketForStaff(req);
  const view = await settleRedemption(booking._id.toString(), serial);
  if (!view) throw new AppError("This ticket hasn't been admitted", 409);
  res.json(view);
});

export const getRedemption = asyncHandler(async (req: Request, res: Response) => {
  const { ticket } = await loadTicketForStaff(req);
  res.json(toRedemptionView(ticket));
});

/** The scanner log for one event, newest first. */
export const listScanLogs = asyncHandler(async (req: Request, res: Response) => {
  const event = await loadScannableEvent(String(req.query.eventId ?? ""), req.user!);
  const limit = Math.min(Math.max(Number(req.query.limit) || LOG_PAGE_SIZE, 1), MAX_LOG_PAGE_SIZE);
  const logs = await ScanLog.find({ event: event._id }).sort({ createdAt: -1 }).limit(limit).lean();
  res.json(
    logs.map((log) => ({
      id: log._id,
      stage: log.stage,
      verdict: log.verdict ?? null,
      reason: log.reason ?? null,
      assetCode: log.assetCode ?? null,
      serial: log.serial ?? null,
      latencyMs: log.latencyMs ?? null,
      txHash: log.txHash ?? null,
      txUrl: log.txHash && log.stage === "redeem.confirmed" ? explorer.tx(log.txHash) : null,
      error: log.error ?? null,
      createdAt: log.createdAt,
    }))
  );
});
