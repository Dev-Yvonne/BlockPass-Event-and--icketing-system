import { Request, Response } from "express";
import { Types } from "mongoose";
import Booking, { IBooking } from "../models/Booking";
import Event, { IEvent } from "../models/Event";
import Review from "../models/Review";
import { presentOrderRow, salesSummary, ticketsPerDay } from "../utils/analytics";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const ORDER_PAGE_SIZE = 200;
const RECENT_ORDERS = 6;

function presentEvent(event: IEvent, value: { orders: number; orderValue: number }) {
  return {
    _id: event._id,
    title: event.title,
    category: event.category,
    venue: event.venue,
    date: event.date,
    imageUrl: event.imageUrl,
    capacity: event.capacity,
    ticketsSold: event.ticketsSold,
    hidden: event.hidden,
    orders: value.orders,
    orderValue: value.orderValue,
  };
}

async function eventsWithSales(events: IEvent[]) {
  const totals = await Booking.aggregate([
    { $match: { event: { $in: events.map((e) => e._id) }, status: "confirmed" } },
    { $group: { _id: "$event", orders: { $sum: 1 }, orderValue: { $sum: "$totalPrice" } } },
  ]);
  const byEvent = new Map(totals.map((row) => [row._id.toString(), row]));
  return events.map((event) =>
    presentEvent(event, byEvent.get(event._id.toString()) ?? { orders: 0, orderValue: 0 })
  );
}

function ordersFor(match: Record<string, unknown>, limit = ORDER_PAGE_SIZE) {
  return Booking.find(match)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate<{ event: IEvent }>("event", "title");
}

const ownEvents = (req: Request) => Event.find({ organizer: req.user!._id }).sort({ date: 1 });

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const events = await ownEvents(req);
  const ids = events.map((event) => event._id);
  const match = { event: { $in: ids } };

  const [sales, daily, rows, recent] = await Promise.all([
    salesSummary(match),
    ticketsPerDay(match),
    eventsWithSales(events),
    ordersFor(match, RECENT_ORDERS),
  ]);

  const now = Date.now();
  res.json({
    stats: {
      ...sales,
      events: events.length,
      upcomingEvents: events.filter((event) => event.date.getTime() >= now).length,
      capacity: events.reduce((sum, event) => sum + event.capacity, 0),
    },
    daily,
    upcoming: rows.filter((event) => event.date.getTime() >= now).slice(0, 5),
    recentOrders: recent.map((order) => presentOrderRow(order as unknown as IBooking & { event: unknown })),
  });
});

export const listOwnEvents = asyncHandler(async (req: Request, res: Response) => {
  res.json(await eventsWithSales(await ownEvents(req)));
});

export const listOwnOrders = asyncHandler(async (req: Request, res: Response) => {
  const ids = (await ownEvents(req)).map((event) => event._id);
  const orders = await ordersFor({ event: { $in: ids }, status: { $ne: "pending" } });
  res.json(orders.map((order) => presentOrderRow(order as unknown as IBooking & { event: unknown })));
});

export const getEventDetail = asyncHandler(async (req: Request, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) throw new AppError("Event not found", 404);
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError("Event not found", 404);

  const isOwner = event.organizer.toString() === req.user!._id.toString();
  if (!isOwner && req.user!.role !== "admin") {
    throw new AppError("Not authorized to view this event", 403);
  }

  const match = { event: event._id };
  const [sales, daily, orders, reviews] = await Promise.all([
    salesSummary(match),
    ticketsPerDay(match),
    ordersFor({ ...match, status: { $ne: "pending" } }),
    Review.find({ event: event._id }).sort({ createdAt: -1 }).populate("user", "name"),
  ]);

  res.json({
    event,
    sales,
    daily,
    reviews,
    orders: orders.map((order) => presentOrderRow(order as unknown as IBooking & { event: unknown })),
  });
});

/** Attendee reviews across every event this organizer hosts. */
export const listFeedback = asyncHandler(async (req: Request, res: Response) => {
  const events = await ownEvents(req);
  const reviews = await Review.find({ event: { $in: events.map((event) => event._id) } })
    .sort({ createdAt: -1 })
    .limit(ORDER_PAGE_SIZE)
    .populate("user", "name")
    .populate("event", "title");
  res.json(reviews);
});
