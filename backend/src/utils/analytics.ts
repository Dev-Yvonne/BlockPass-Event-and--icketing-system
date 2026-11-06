import { FilterQuery } from "mongoose";
import Booking, { IBooking } from "../models/Booking";
import { explorer } from "../services/stellar/config";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SalesSummary {
  orders: number;
  tickets: number;
  orderValue: number;
}

/** Totals for confirmed orders only: failed mints never issued anything. */
export async function salesSummary(match: FilterQuery<IBooking> = {}): Promise<SalesSummary> {
  const [totals] = await Booking.aggregate([
    { $match: { ...match, status: "confirmed" } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        tickets: { $sum: "$quantity" },
        orderValue: { $sum: "$totalPrice" },
      },
    },
  ]);
  return {
    orders: totals?.orders ?? 0,
    tickets: totals?.tickets ?? 0,
    orderValue: totals?.orderValue ?? 0,
  };
}

/** Tickets issued per UTC day, oldest first, with quiet days filled as zero. */
export async function ticketsPerDay(match: FilterQuery<IBooking> = {}, days = 14) {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const start = new Date(today.getTime() - (days - 1) * DAY_MS);

  const rows: { _id: string; tickets: number }[] = await Booking.aggregate([
    { $match: { ...match, status: "confirmed", createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        tickets: { $sum: "$quantity" },
      },
    },
  ]);
  const byDate = new Map(rows.map((row) => [row._id, row.tickets]));

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start.getTime() + i * DAY_MS).toISOString().slice(0, 10);
    return { date, tickets: byDate.get(date) ?? 0 };
  });
}

/** One order as organizers and admins see it, including attendee contact. */
export function presentOrderRow(booking: IBooking & { event: unknown }) {
  const event = booking.event as { _id?: unknown; title?: string } | null;
  const txHash = booking.stellar?.txHash;
  return {
    reference: booking.ticketCode,
    status: booking.status,
    attendeeName: booking.attendeeName,
    attendeeEmail: booking.attendeeEmail,
    tierName: booking.tierName,
    quantity: booking.quantity,
    totalPrice: booking.totalPrice,
    createdAt: booking.createdAt,
    eventId: event?._id,
    eventTitle: event?.title ?? "Deleted event",
    assetCodes: booking.tickets.map((ticket) => ticket.assetCode),
    txUrl: txHash ? explorer.tx(txHash) : null,
  };
}
