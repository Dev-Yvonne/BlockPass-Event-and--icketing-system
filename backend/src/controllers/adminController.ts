import { Request, Response } from "express";
import { Types } from "mongoose";
import Booking, { IBooking } from "../models/Booking";
import Event, { IEvent } from "../models/Event";
import MintLog from "../models/MintLog";
import User from "../models/User";
import { explorer, getDistributorKeypair, getHorizon } from "../services/stellar/config";
import { presentOrderRow, salesSummary, ticketsPerDay } from "../utils/analytics";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const PAGE_SIZE = 200;
const ACTIVITY_SIZE = 100;
const ROLES = ["attendee", "organizer", "admin"];

/** A Horizon outage should degrade the overview, not break it. */
async function distributorStatus() {
  try {
    const publicKey = getDistributorKeypair().publicKey();
    const account = await getHorizon().loadAccount(publicKey);
    const native = account.balances.find((balance) => balance.asset_type === "native");
    return { publicKey, balance: Number(native?.balance ?? 0), url: explorer.account(publicKey) };
  } catch {
    return null;
  }
}

export const getOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [sales, daily, users, events, failed, distributor, activity] = await Promise.all([
    salesSummary(),
    ticketsPerDay(),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Event.countDocuments({ date: { $gte: new Date() }, hidden: { $ne: true } }),
    Booking.countDocuments({ status: "failed" }),
    distributorStatus(),
    MintLog.find({ stage: { $in: ["mint.confirmed", "mint.failed"] } })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
  ]);

  const counts = Object.fromEntries(users.map((row) => [row._id, row.count]));
  const attempts = sales.orders + failed;

  res.json({
    stats: {
      ...sales,
      failedOrders: failed,
      successRate: attempts > 0 ? sales.orders / attempts : null,
      liveEvents: events,
      attendees: counts.attendee ?? 0,
      organizers: counts.organizer ?? 0,
      admins: counts.admin ?? 0,
    },
    daily,
    distributor,
    activity,
  });
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(PAGE_SIZE);
  res.json(
    users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      suspended: user.suspended,
      createdAt: user.createdAt,
    }))
  );
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) throw new AppError("User not found", 404);
  const { role, suspended } = req.body;

  // Stops an admin locking themselves, and possibly everyone, out of this page.
  if (req.params.id === req.user!._id.toString()) {
    throw new AppError("You can't change your own account here", 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404);

  if (role !== undefined) {
    if (!ROLES.includes(role)) throw new AppError("Unknown role", 400);
    user.role = role;
  }
  if (suspended !== undefined) {
    if (typeof suspended !== "boolean") throw new AppError("suspended must be true or false", 400);
    user.suspended = suspended;
  }
  await user.save();

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    suspended: user.suspended,
    createdAt: user.createdAt,
  });
});

export const listAllEvents = asyncHandler(async (_req: Request, res: Response) => {
  const events = await Event.find()
    .sort({ date: -1 })
    .limit(PAGE_SIZE)
    .populate<{ organizer: { name: string; email: string } }>("organizer", "name email");

  const totals = await Booking.aggregate([
    { $match: { status: "confirmed" } },
    { $group: { _id: "$event", orderValue: { $sum: "$totalPrice" } } },
  ]);
  const values = new Map(totals.map((row) => [row._id.toString(), row.orderValue]));

  res.json(
    events.map((event) => ({
      _id: event._id,
      title: event.title,
      venue: event.venue,
      category: event.category,
      date: event.date,
      capacity: event.capacity,
      ticketsSold: event.ticketsSold,
      hidden: event.hidden,
      organizerName: event.organizer?.name ?? "Unknown",
      orderValue: values.get(event._id.toString()) ?? 0,
    }))
  );
});

export const updateEventVisibility = asyncHandler(async (req: Request, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) throw new AppError("Event not found", 404);
  if (typeof req.body.hidden !== "boolean") throw new AppError("hidden must be true or false", 400);

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { hidden: req.body.hidden },
    { new: true }
  );
  if (!event) throw new AppError("Event not found", 404);
  res.json({ _id: event._id, hidden: event.hidden });
});

export const listAllOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await Booking.find({ status: { $ne: "pending" } })
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE)
    .populate<{ event: IEvent }>("event", "title");
  res.json(orders.map((order) => presentOrderRow(order as unknown as IBooking & { event: unknown })));
});

export const listActivity = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await MintLog.find().sort({ createdAt: -1 }).limit(ACTIVITY_SIZE).lean());
});
