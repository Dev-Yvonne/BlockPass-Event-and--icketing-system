import { Link } from "react-router-dom";
import { EventItem } from "../types";

export function EventCard({ event }: { event: EventItem }) {
  const remaining = event.capacity - event.ticketsSold;

  return (
    <Link to={`/events/${event._id}`} className="event-card">
      <div className="event-card-image">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} />
        ) : (
          <div className="event-card-placeholder">{event.category}</div>
        )}
      </div>
      <div className="event-card-body">
        <h3>{event.title}</h3>
        <p className="event-card-meta">
          {new Date(event.date).toLocaleDateString()} · {event.venue}
        </p>
        <p className="event-card-footer">
          <span>${event.price.toFixed(2)}</span>
          <span>{remaining > 0 ? `${remaining} left` : "Sold out"}</span>
        </p>
      </div>
    </Link>
  );
}
