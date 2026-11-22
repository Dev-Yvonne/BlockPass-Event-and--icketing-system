import { Request, Response } from "express";
import Booking, { IBooking } from "../models/Booking";
import { IEvent } from "../models/Event";
import { resumeStaleRedemptions } from "../services/gate";
import { signPassToken } from "../services/passes/passToken";
import { getPassSigningKeypair } from "../services/stellar/config";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { toOrderResponse } from "./checkoutController";

async function findOrder(reference: unknown) {
  const booking = await Booking.findOne({ ticketCode: String(reference) }).populate<{ event: IEvent }>(
    "event"
  );
  if (!booking) throw new AppError("Pass not found", 404);
  return booking;
}

/** The order reference is the pass key, the same way it opens the receipt. */
export const getPass = asyncHandler(async (req: Request, res: Response) => {
  let booking = await findOrder(req.params.reference);
  if (await resumeStaleRedemptions(booking as unknown as IBooking)) {
    booking = await findOrder(req.params.reference);
  }
  res.json(toOrderResponse(booking as unknown as IBooking, booking.event));
});

/** Issues a fresh 30-second QR token for one ticket that hasn't been used yet. */
export const issuePassToken = asyncHandler(async (req: Request, res: Response) => {
  const booking = await findOrder(req.params.reference);
  if (booking.status !== "confirmed") throw new AppError("These tickets weren't issued", 409);

  const serial = Number(req.params.serial);
  const ticket = booking.tickets.find((t) => t.serial === serial);
  if (!ticket) throw new AppError("Ticket not found", 404);
  if (ticket.redemption?.status) {
    throw new AppError("This ticket has already been checked in", 409);
  }

  const { token, expiresAt } = signPassToken(
    { bookingId: booking._id.toString(), serial },
    getPassSigningKeypair()
  );
  res.set("Cache-Control", "no-store").json({ token, expiresAt, serverTime: Date.now() });
});
