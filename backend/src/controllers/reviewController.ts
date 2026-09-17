import { Request, Response } from "express";
import Review from "../models/Review";
import Event from "../models/Event";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const listEventReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await Review.find({ event: req.params.eventId })
    .sort({ createdAt: -1 })
    .populate("user", "name");
  res.json(reviews);
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const { rating, comment } = req.body;

  if (!eventId || rating == null || !comment) {
    throw new AppError("rating and comment are required", 400);
  }
  if (rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  const event = await Event.findById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  const existing = await Review.findOne({ event: eventId, user: req.user!._id });
  if (existing) throw new AppError("You have already reviewed this event", 409);

  const review = await Review.create({
    event: eventId,
    user: req.user!._id,
    rating,
    comment,
  });

  res.status(201).json(review);
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError("Review not found", 404);

  const isOwner = review.user.toString() === req.user!._id.toString();
  if (!isOwner && req.user!.role !== "admin") {
    throw new AppError("Not authorized to delete this review", 403);
  }

  await review.deleteOne();
  res.json({ message: "Review deleted" });
});
