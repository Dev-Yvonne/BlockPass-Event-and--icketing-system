"use client";

import { CalendarPlus, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState, EventBadge, LoadingState, Meter, PageHeader, SearchField } from "../../../../components/ui";
import * as api from "../../../../lib/api";
import { formatPrice, formatShortDate } from "../../../../lib/format";
import { useResource } from "../../../../lib/useResource";

export default function OrganizerEvents() {
  const { data: events, error, reload } = useResource(api.getOrganizerEvents);
  const [query, setQuery] = useState("");

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!events) return <LoadingState />;

  const needle = query.toLowerCase();
  const shown = events.filter((event) =>
    `${event.title} ${event.venue}`.toLowerCase().includes(needle)
  );

  return (
    <>
      <PageHeader
        title="Events"
        description="Everything you're hosting."
        actions={
          <Link className="btn" href="/organizer/events/new">
            <Plus size={16} aria-hidden="true" />
            Create event
          </Link>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No events yet"
          action={
            <Link className="btn" href="/organizer/events/new">
              Create event
            </Link>
          }
        />
      ) : (
        <>
          <div className="toolbar">
            <SearchField value={query} onChange={setQuery} label="Search events" />
          </div>
          {shown.length === 0 && <p className="muted">No events match your search.</p>}
          <ul className="manage-list">
            {shown.map((event) => (
              <li key={event._id}>
                <Link href={`/organizer/events/${event._id}`}>
                  <div className="manage-photo">
                    {event.imageUrl ? <img src={event.imageUrl} alt="" /> : <span>{event.category}</span>}
                  </div>
                  <div className="manage-main">
                    <div className="manage-title">
                      <h3>{event.title}</h3>
                      <EventBadge
                        date={event.date}
                        hidden={event.hidden}
                        soldOut={event.ticketsSold >= event.capacity}
                      />
                    </div>
                    <p>
                      {formatShortDate(event.date)} · {event.venue}
                    </p>
                  </div>
                  <div className="manage-sales">
                    <Meter value={event.ticketsSold} max={event.capacity} label="Issued" />
                  </div>
                  <div className="manage-value">
                    <strong>{formatPrice(event.orderValue)}</strong>
                    <small>{event.orders} orders</small>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
