"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog, ErrorState, EventBadge, LoadingState, PageHeader, Panel, SearchField } from "../../../../components/ui";
import * as api from "../../../../lib/api";
import { formatNumber, formatPrice, formatShortDate } from "../../../../lib/format";
import { useResource } from "../../../../lib/useResource";
import { AdminEvent } from "../../../../types";

export default function AdminEvents() {
  const { data: events, error, reload } = useResource(api.getAdminEvents);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<AdminEvent | null>(null);
  const [actionError, setActionError] = useState("");

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!events) return <LoadingState />;

  const needle = query.toLowerCase();
  const shown = events.filter((event) =>
    `${event.title} ${event.venue} ${event.organizerName}`.toLowerCase().includes(needle)
  );

  async function toggle() {
    if (!target) return;
    const { _id, hidden } = target;
    setTarget(null);
    try {
      await api.setEventHidden(_id, !hidden);
      await reload();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader title="Events" description="All events on the platform, including hidden and ended ones." />
      <div className="toolbar">
        <SearchField value={query} onChange={setQuery} label="Search by event, venue or organizer" />
      </div>
      {actionError && <p className="form-error">{actionError}</p>}
      <Panel flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Organizer</th>
                <th scope="col">Date</th>
                <th scope="col">Issued</th>
                <th scope="col">Value</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((event) => (
                <tr key={event._id}>
                  <td data-label="Event">
                    <Link className="cell-title" href={`/organizer/events/${event._id}`}>
                      {event.title}
                    </Link>
                    <span className="cell-sub">{event.venue}</span>
                  </td>
                  <td data-label="Organizer">{event.organizerName}</td>
                  <td data-label="Date">{formatShortDate(event.date)}</td>
                  <td data-label="Issued">
                    {formatNumber(event.ticketsSold)} of {formatNumber(event.capacity)}
                  </td>
                  <td data-label="Value">{formatPrice(event.orderValue)}</td>
                  <td data-label="Status">
                    <EventBadge date={event.date} hidden={event.hidden} soldOut={event.ticketsSold >= event.capacity} />
                  </td>
                  <td className="cell-actions">
                    <button className="btn secondary small" onClick={() => setTarget(event)}>
                      {event.hidden ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
                      {event.hidden ? "Show" : "Hide"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <ConfirmDialog
        open={!!target}
        title={target?.hidden ? "Show this event?" : "Hide this event?"}
        body={
          target?.hidden
            ? `${target.title} will return to the storefront.`
            : `${target?.title} will leave the storefront and stop taking registrations. Issued tickets stay valid.`
        }
        confirmLabel={target?.hidden ? "Show event" : "Hide event"}
        danger={!target?.hidden}
        onConfirm={toggle}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
