import { useEffect, useState } from "react";
import { Booking, EventItem } from "../types";
import * as bookingsApi from "../api/bookings";

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    bookingsApi.getMyBookings().then(setBookings).finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCancel(id: string) {
    await bookingsApi.cancelBooking(id);
    refresh();
  }

  if (loading) return <p className="status">Loading…</p>;

  return (
    <div className="page">
      <h1>My Bookings</h1>
      {bookings.length === 0 && <p className="status">You have no bookings yet.</p>}
      <ul className="booking-list">
        {bookings.map((booking) => {
          const event = booking.event as EventItem;
          return (
            <li key={booking._id} className={booking.status === "cancelled" ? "cancelled" : ""}>
              <div>
                <strong>{typeof event === "object" ? event.title : "Event"}</strong>
                <p>
                  Ticket code: {booking.ticketCode} · Qty: {booking.quantity} · $
                  {booking.totalPrice.toFixed(2)} · {booking.status}
                </p>
              </div>
              {booking.status === "confirmed" && (
                <button onClick={() => handleCancel(booking._id)}>Cancel</button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
