import { Request, Response } from "express";
import { Types } from "mongoose";
import Booking from "../models/Booking";
import Event from "../models/Event";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const MAX_TIERS = 6;

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
}

interface TierInput {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  capacity?: unknown;
}

/** Validates submitted tiers, or makes a single tier for a flat-priced event. */
function buildTiers(body: { tiers?: TierInput[]; price?: unknown; capacity?: unknown }) {
  const input: TierInput[] =
    Array.isArray(body.tiers) && body.tiers.length > 0
      ? body.tiers
      : [{ name: "General Admission", price: body.price, capacity: body.capacity }];

  if (input.length > MAX_TIERS) throw new AppError(`An event can have at most ${MAX_TIERS} tiers`, 400);

  return input.map((tier) => {
    const name = typeof tier.name === "string" ? tier.name.trim() : "";
    const price = Number(tier.price);
    const capacity = Number(tier.capacity);
    if (!name) throw new AppError("Every ticket tier needs a name", 400);
    if (!Number.isFinite(price) || price < 0) throw new AppError("Tier price must be 0 or more", 400);
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new AppError("Tier capacity must be at least 1", 400);
    }
    return {
      name,
      description: typeof tier.description === "string" ? tier.description : undefined,
      price,
      capacity,
      remaining: capacity,
    };
  });
}

export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const { category, search } = req.query;
  const filter: Record<string, unknown> = {
    date: { $gte: new Date() },
    hidden: { $ne: true },
  };

  if (typeof category === "string" && category) filter.category = category;
  if (typeof search === "string" && search) {
    const pattern = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: pattern, $options: "i" } },
      { venue: { $regex: pattern, $options: "i" } },
    ];
  }

  const events = await Event.find(filter)
    .sort({ date: 1 })
    .populate("organizer", "name");
  res.json(events);
});

export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) throw new AppError("Event not found", 404);
  const event = await Event.findById(req.params.id).populate("organizer", "name");
  if (!event || event.hidden) throw new AppError("Event not found", 404);
  res.json(event);
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, category, venue, date, imageUrl } = req.body;

  if (!title || !description || !category || !venue || !date) {
    throw new AppError("Missing required event fields", 400);
  }

  const tiers = buildTiers(req.body);

  const event = await Event.create({
    title,
    description,
    category,
    venue,
    date,
    price: Math.min(...tiers.map((tier) => tier.price)),
    capacity: tiers.reduce((sum, tier) => sum + tier.capacity, 0),
    tiers,
    imageUrl,
    gallery: stringList(req.body.gallery),
    highlights: stringList(req.body.highlights),
    schedule: Array.isArray(req.body.schedule) ? req.body.schedule : [],
    venueNotes: req.body.venueNotes,
    localCurrency: req.body.localCurrency,
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
    "imageUrl",
    "gallery",
    "highlights",
    "schedule",
    "venueNotes",
    "localCurrency",
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

  if (await Booking.exists({ event: event._id, status: "confirmed" })) {
    throw new AppError("This event has tickets issued on-chain and can't be deleted", 409);
  }

  await event.deleteOne();
  res.json({ message: "Event deleted" });
});
