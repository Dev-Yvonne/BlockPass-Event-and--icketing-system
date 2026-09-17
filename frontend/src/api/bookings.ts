import { api } from "./client";
import { Booking } from "../types";

export function createBooking(eventId: string, quantity: number) {
  return api.post<Booking>("/bookings", { eventId, quantity }).then((res) => res.data);
}

export function getMyBookings() {
  return api.get<Booking[]>("/bookings/my").then((res) => res.data);
}

export function cancelBooking(id: string) {
  return api.patch(`/bookings/${id}/cancel`).then((res) => res.data);
}
