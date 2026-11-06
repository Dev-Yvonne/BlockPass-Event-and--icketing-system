"use client";

import { ArrowRight, CalendarCheck, CalendarPlus, Compass, History, Ticket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TicketCard } from "../../../components/TicketCard";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatCard } from "../../../components/ui";
import { useAuth } from "../../../context/AuthContext";
import * as api from "../../../lib/api";
import { isPast } from "../../../lib/format";
import { useResource } from "../../../lib/useResource";

export default function AttendeeOverview() {
  const { user, becomeOrganizer } = useAuth();
  const router = useRouter();
  const { data: orders, error, reload } = useResource(api.getMyTickets);
  const [upgrading, setUpgrading] = useState(false);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!orders) return <LoadingState />;

  const issued = orders.filter((order) => order.status === "confirmed");
  const upcoming = issued
    .filter((order) => !isPast(order.event.date))
    .sort((a, b) => a.event.date.localeCompare(b.event.date));
  const upcomingTickets = upcoming.reduce((sum, order) => sum + order.quantity, 0);
  const eventsAttended = new Set(
    issued.filter((order) => isPast(order.event.date)).map((order) => order.event.id)
  ).size;
  const next = upcoming[0];

  async function startHosting() {
    setUpgrading(true);
    await becomeOrganizer();
    router.push("/organizer");
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${user!.name.split(" ")[0]}`}
        description="Your tickets and upcoming events."
      />

      <div className="stat-grid three">
        <StatCard label="Upcoming tickets" value={String(upcomingTickets)} icon={Ticket} />
        <StatCard label="Upcoming events" value={String(new Set(upcoming.map((o) => o.event.id)).size)} icon={CalendarCheck} />
        <StatCard label="Past events" value={String(eventsAttended)} icon={History} />
      </div>

      <div className="workspace-grid">
        <Panel
          title="Your next event"
          action={
            <Link className="text-link" href="/dashboard/tickets">
              All tickets
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        >
          {next ? (
            <TicketCard order={next} ticket={next.tickets[0]} showReceipt />
          ) : (
            <EmptyState
              icon={Compass}
              title="No upcoming tickets"
              action={
                <Link className="btn" href="/">
                  Find events
                </Link>
              }
            >
              Tickets you get while logged in will appear here.
            </EmptyState>
          )}
        </Panel>

        {user!.role === "attendee" && (
          <Panel title="Host your own event">
            <div className="host-card">
              <CalendarPlus size={24} aria-hidden="true" />
              <p>
                Publish an event, set ticket tiers and track sales from your own organizer
                workspace, using this same account.
              </p>
              <button className="btn secondary full" disabled={upgrading} onClick={startHosting}>
                {upgrading ? "Setting up…" : "Start hosting"}
              </button>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
