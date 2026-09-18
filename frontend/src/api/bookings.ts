import { Booking } from "../types";
import {
  apiError,
  delay,
  getBookings,
  getCurrentUser,
  getEvents,
  newId,
  saveBookings,
  saveEvents,
} from "../mockStore";

export function createBooking(eventId: string, quantity: number) {
  const user = getCurrentUser();
  if (!user) return Promise.reject(apiError("Not authenticated"));

  const events = getEvents();
  const event = events.find((e) => e._id === eventId);
  if (!event) return Promise.reject(apiError("Event not found"));

  const remaining = event.capacity - event.ticketsSold;
  if (quantity < 1 || quantity > remaining) {
    return Promise.reject(apiError("Not enough tickets remaining"));
  }

  event.ticketsSold += quantity;
  saveEvents(events);

  const booking: Booking = {
    _id: newId("booking"),
    user: user.id,
    event: eventId,
    quantity,
    totalPrice: Number((event.price * quantity).toFixed(2)),
    status: "confirmed",
    ticketCode: newId("tix").toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  const bookings = getBookings();
  bookings.unshift(booking);
  saveBookings(bookings);
  return delay(booking);
}

export function getMyBookings() {
  const user = getCurrentUser();
  if (!user) return delay<Booking[]>([]);
  const events = getEvents();
  const bookings = getBookings()
    .filter((b) => b.user === user.id)
    .map((b) => ({ ...b, event: events.find((e) => e._id === b.event) || b.event }));
  return delay(bookings);
}

export function cancelBooking(id: string) {
  const bookings = getBookings();
  const booking = bookings.find((b) => b._id === id);
  if (!booking) return Promise.reject(apiError("Booking not found"));

  if (booking.status === "confirmed") {
    booking.status = "cancelled";
    const events = getEvents();
    const eventId = typeof booking.event === "string" ? booking.event : booking.event._id;
    const event = events.find((e) => e._id === eventId);
    if (event) {
      event.ticketsSold = Math.max(0, event.ticketsSold - booking.quantity);
      saveEvents(events);
    }
  }
  saveBookings(bookings);
  return delay(booking);
}
