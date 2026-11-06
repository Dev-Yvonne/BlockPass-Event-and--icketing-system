"use client";

import { ArrowLeft, Download, ExternalLink, Pencil, Receipt, Ticket, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart } from "../../../../../components/BarChart";
import { ReviewList, ReviewSummary } from "../../../../../components/ReviewSummary";
import { OrdersTable } from "../../../../../components/OrdersTable";
import { ConfirmDialog, ErrorState, EventBadge, LoadingState, Meter, PageHeader, Panel, SearchField, StatCard } from "../../../../../components/ui";
import * as api from "../../../../../lib/api";
import { downloadCsv, formatDate, formatNumber, formatPrice } from "../../../../../lib/format";
import { useResource } from "../../../../../lib/useResource";

export default function OrganizerEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, reload } = useResource(() => api.getOrganizerEvent(id));
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState("");

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <LoadingState />;

  const { event, sales, daily, orders, reviews } = data;
  const needle = query.toLowerCase();
  const shown = orders.filter((order) =>
    `${order.attendeeName} ${order.attendeeEmail}`.toLowerCase().includes(needle)
  );

  function exportAttendees() {
    downloadCsv(`${event.title} attendees.csv`, [
      ["Name", "Email", "Tier", "Quantity", "Ticket codes", "Order"],
      ...orders
        .filter((order) => order.status === "confirmed")
        .map((order) => [
          order.attendeeName,
          order.attendeeEmail,
          order.tierName,
          order.quantity,
          order.assetCodes.join(" "),
          order.reference,
        ]),
    ]);
  }

  async function remove() {
    setConfirming(false);
    try {
      await api.deleteEvent(event._id);
      router.push("/organizer/events");
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  return (
    <>
      <Link className="back-link" href="/organizer/events">
        <ArrowLeft size={15} aria-hidden="true" />
        Events
      </Link>
      <PageHeader
        title={event.title}
        description={`${formatDate(event.date)} · ${event.venue}`}
        actions={
          <>
            <EventBadge date={event.date} hidden={event.hidden} soldOut={event.ticketsSold >= event.capacity} />
            {!event.hidden && (
              <Link className="btn secondary small" href={`/events/${event._id}`}>
                <ExternalLink size={15} aria-hidden="true" />
                View page
              </Link>
            )}
            <Link className="btn secondary small" href={`/organizer/events/${event._id}/edit`}>
              <Pencil size={15} aria-hidden="true" />
              Edit
            </Link>
          </>
        }
      />

      {event.hidden && (
        <p className="notice">An administrator has hidden this event, so it can't take new registrations.</p>
      )}

      <div className="stat-grid three">
        <StatCard label="Tickets issued" value={formatNumber(sales.tickets)} note={`of ${formatNumber(event.capacity)} capacity`} icon={Ticket} />
        <StatCard label="Order value" value={formatPrice(sales.orderValue)} note="Test mode" icon={Receipt} />
        <StatCard label="Orders" value={formatNumber(sales.orders)} icon={Users} />
      </div>

      <div className="workspace-grid">
        <Panel title="Tickets issued per day" description="Last 14 days">
          <BarChart data={daily} label="Tickets issued per day, last 14 days" />
        </Panel>
        <Panel title="Ticket tiers">
          <ul className="event-progress plain">
            {event.tiers.map((tier) => (
              <li key={tier._id}>
                <Meter value={tier.capacity - tier.remaining} max={tier.capacity} label={`${tier.name}, ${formatPrice(tier.price)}`} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        flush
        title="Attendees"
        action={
          <button className="btn secondary small" onClick={exportAttendees} disabled={sales.orders === 0}>
            <Download size={15} aria-hidden="true" />
            Export CSV
          </button>
        }
      >
        {orders.length === 0 ? (
          <p className="muted pad">No registrations yet.</p>
        ) : (
          <>
            <div className="panel-toolbar">
              <SearchField value={query} onChange={setQuery} label="Search attendees" />
            </div>
            <OrdersTable orders={shown} showEvent={false} />
          </>
        )}
      </Panel>

      <Panel title="Attendee feedback" description="Ratings and reviews from ticket holders">
        <ReviewSummary reviews={reviews} />
        {reviews.length > 0 && <ReviewList reviews={reviews} />}
      </Panel>

      {sales.orders === 0 && (
        <div className="danger-zone">
          <div>
            <h2>Delete event</h2>
            <p>This event has no issued tickets, so it can still be removed.</p>
          </div>
          <button className="btn danger-outline small" onClick={() => setConfirming(true)}>
            <Trash2 size={15} aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
      {actionError && <p className="form-error">{actionError}</p>}

      <ConfirmDialog
        open={confirming}
        title="Delete this event?"
        body={`${event.title} will be permanently removed.`}
        confirmLabel="Delete event"
        danger
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
