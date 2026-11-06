import { MapPin } from "lucide-react";
import Link from "next/link";
import { dateParts, formatPrice } from "../lib/format";
import { EventItem } from "../types";

export function EventCard({ event }: { event: EventItem }) {
  const remaining = event.capacity - event.ticketsSold;
  const { day, month } = dateParts(event.date);

  return (
    <Link href={`/events/${event._id}`} className="event-card">
      <div className="event-card-image">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="event-card-placeholder">{event.category}</span>
        )}
        <span className="date-chip">
          <strong>{day}</strong>
          {month}
        </span>
      </div>
      <div className="event-card-body">
        <span className="event-card-category">{event.category}</span>
        <h3>{event.title}</h3>
        <p className="event-card-venue">
          <MapPin size={14} aria-hidden="true" />
          {event.venue}
        </p>
        <p className="event-card-footer">
          <span>From {formatPrice(event.price)}</span>
          <span className={remaining > 0 ? "" : "sold-out"}>
            {remaining > 0 ? `${remaining.toLocaleString("en-US")} left` : "Sold out"}
          </span>
        </p>
      </div>
    </Link>
  );
}
