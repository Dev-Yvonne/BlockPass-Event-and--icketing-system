import { Request, Response } from "express";
import Event from "../models/Event";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const { category, search } = req.query;
  const filter: Record<string, unknown> = {};

  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { venue: { $regex: search, $options: "i" } },
    ];
  }

  const events = await Event.find(filter)
    .sort({ date: 1 })
    .populate("organizer", "name email");
  res.json(events);
});

export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id).populate(
    "organizer",
    "name email"
  );
  if (!event) throw new AppError("Event not found", 404);
  res.json(event);
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, category, venue, date, price, capacity, imageUrl } =
    req.body;

  if (!title || !description || !category || !venue || !date || price == null || !capacity) {
    throw new AppError("Missing required event fields", 400);
  }

  const event = await Event.create({
    title,
    description,
    category,
    venue,
    date,
    price,
    capacity,
    imageUrl,
    organizer: req.user!._id,
  });

  res.status(201).json(event);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError("Event not found", 404);

  const isOwner = event.organizer.toString() === req.user!._id.toString();
  if (!isOwner && req.user!.role !== "admin") {
    throw new AppError("Not authorized to modify this event", 403);
  }

  const allowedFields = [
    "title",
    "description",
    "category",
    "venue",
    "date",
    "price",
    "capacity",
    "imageUrl",
  ] as const;

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      (event as unknown as Record<string, unknown>)[field] = req.body[field];
    }
  }

  await event.save();
  res.json(event);
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError("Event not found", 404);

  const isOwner = event.organizer.toString() === req.user!._id.toString();
  if (!isOwner && req.user!.role !== "admin") {
    throw new AppError("Not authorized to delete this event", 403);
  }

  await event.deleteOne();
  res.json({ message: "Event deleted" });
});
