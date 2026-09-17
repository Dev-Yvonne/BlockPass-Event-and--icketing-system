import { Request, Response } from "express";
import Booking from "../models/Booking";
import Event from "../models/Event";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { eventId, quantity } = req.body;
  const qty = Number(quantity) || 1;

  if (!eventId) throw new AppError("eventId is required", 400);
  if (qty < 1) throw new AppError("Quantity must be at least 1", 400);

  const event = await Event.findById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  // Atomically reserve tickets to avoid overselling under concurrent requests.
  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      $expr: { $lte: [{ $add: ["$ticketsSold", qty] }, "$capacity"] },
    },
    { $inc: { ticketsSold: qty } },
    { new: true }
  );

  if (!updatedEvent) {
    throw new AppError("Not enough tickets remaining", 409);
  }

  const booking = await Booking.create({
    user: req.user!._id,
    event: event._id,
    quantity: qty,
    totalPrice: event.price * qty,
  });

  res.status(201).json(booking);
});

export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await Booking.find({ user: req.user!._id })
    .sort({ createdAt: -1 })
    .populate("event");
  res.json(bookings);
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

  const isOwner = booking.user.toString() === req.user!._id.toString();
  if (!isOwner && req.user!.role !== "admin") {
    throw new AppError("Not authorized to cancel this booking", 403);
  }

  if (booking.status === "cancelled") {
    throw new AppError("Booking is already cancelled", 400);
  }

  booking.status = "cancelled";
  await booking.save();

  await Event.findByIdAndUpdate(booking.event, {
    $inc: { ticketsSold: -booking.quantity },
  });

  res.json({ message: "Booking cancelled" });
});
