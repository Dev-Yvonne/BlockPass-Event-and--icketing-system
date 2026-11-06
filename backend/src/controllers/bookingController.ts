import { Request, Response } from "express";
import Booking, { IBooking } from "../models/Booking";
import Event, { IEvent } from "../models/Event";
import { toOrderResponse } from "./checkoutController";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await Booking.find({ user: req.user!._id, status: { $ne: "pending" } })
    .sort({ createdAt: -1 })
    .populate<{ event: IEvent }>("event");
  res.json(
    bookings.map((booking) => toOrderResponse(booking as unknown as IBooking, booking.event))
  );
});

export const getEventBookings = asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) throw new AppError("Event not found", 404);

  const isOwner = event.organizer.toString() === req.user!._id.toString();
  if (!isOwner && req.user!.role !== "admin") {
    throw new AppError("Not authorized to view these bookings", 403);
  }

  const bookings = await Booking.find({ event: event._id })
    .sort({ createdAt: -1 })
    .populate("user", "name email");
  res.json(bookings);
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError("Booking not found", 404);

  const isOwner = booking.user?.toString() === req.user!._id.toString();
  if (!isOwner && req.user!.role !== "admin") {
    throw new AppError("Not authorized to cancel this booking", 403);
  }

  if (booking.status === "cancelled") {
    throw new AppError("Booking is already cancelled", 400);
  }
  // Revoking a ticket on-chain is part of the gate-scanner work, not Round 1.
  if (booking.status === "confirmed") {
    throw new AppError("Tickets already issued on Stellar can't be cancelled yet", 409);
  }

  booking.status = "cancelled";
  await booking.save();

  res.json({ message: "Booking cancelled" });
});
