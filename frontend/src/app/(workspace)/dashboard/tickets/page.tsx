"use client";

import { Ticket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TicketCard } from "../../../../components/TicketCard";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../../../../components/ui";
import * as api from "../../../../lib/api";
import { isPast } from "../../../../lib/format";
import { useResource } from "../../../../lib/useResource";

export default function TicketsPage() {
  const { data: orders, error, reload } = useResource(api.getMyTickets);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!orders) return <LoadingState />;

  const issued = orders.filter((order) => order.status === "confirmed");
  const upcoming = issued
    .filter((order) => !isPast(order.event.date))
    .sort((a, b) => a.event.date.localeCompare(b.event.date));
  const past = issued.filter((order) => isPast(order.event.date));
  const shown = tab === "upcoming" ? upcoming : past;

  return (
    <>
      <PageHeader title="My tickets" description="Every ticket has its own serial and public record." />

      <div className="tabs" role="tablist" aria-label="Ticket period">
        {(["upcoming", "past"] as const).map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            className={tab === name ? "active" : ""}
            onClick={() => setTab(name)}
          >
            {name === "upcoming" ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={tab === "upcoming" ? "No upcoming tickets" : "No past tickets"}
          action={
            tab === "upcoming" && (
              <Link className="btn" href="/">
                Find events
              </Link>
            )
          }
        >
          Only tickets you get while logged in appear here. Guest orders stay on their confirmation
          page.
        </EmptyState>
      ) : (
        <div className="ticket-grid">
          {shown.flatMap((order) =>
            order.tickets.map((ticket) => (
              <TicketCard key={ticket.assetCode} order={order} ticket={ticket} showReceipt />
            ))
          )}
        </div>
      )}
    </>
  );
}
