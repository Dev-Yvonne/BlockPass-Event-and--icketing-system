"use client";

import { ArrowRight, CalendarDays, CalendarPlus, DollarSign, Receipt, Ticket } from "lucide-react";
import Link from "next/link";
import { BarChart } from "../../../components/BarChart";
import { OrdersTable } from "../../../components/OrdersTable";
import { EmptyState, ErrorState, LoadingState, Meter, PageHeader, Panel, StatCard } from "../../../components/ui";
import * as api from "../../../lib/api";
import { formatNumber, formatPrice, formatShortDate } from "../../../lib/format";
import { useResource } from "../../../lib/useResource";

export default function OrganizerOverview() {
  const { data, error, reload } = useResource(api.getOrganizerOverview);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <LoadingState />;

  const { stats, daily, upcoming, recentOrders } = data;

  if (stats.events === 0) {
    return (
      <>
        <PageHeader title="Organizer overview" />
        <EmptyState
          icon={CalendarPlus}
          title="Create your first event"
          action={
            <Link className="btn" href="/organizer/events/new">
              Create event
            </Link>
          }
        >
          Publish an event and its ticket tiers. Sales and attendees will appear here.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Organizer overview" description="How your events are selling." />

      <div className="stat-grid">
        <StatCard label="Tickets issued" value={formatNumber(stats.tickets)} note={`of ${formatNumber(stats.capacity)} capacity`} icon={Ticket} />
        <StatCard label="Order value" value={formatPrice(stats.orderValue)} note="Test mode" icon={DollarSign} />
        <StatCard label="Orders" value={formatNumber(stats.orders)} icon={Receipt} />
        <StatCard label="Upcoming events" value={formatNumber(stats.upcomingEvents)} note={`${stats.events} in total`} icon={CalendarDays} />
      </div>

      <div className="workspace-grid">
        <Panel title="Tickets issued per day" description="Last 14 days">
          <BarChart data={daily} label="Tickets issued per day, last 14 days" />
        </Panel>

        <Panel
          title="Upcoming events"
          action={
            <Link className="text-link" href="/organizer/events">
              All events
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <p className="muted">No upcoming events.</p>
          ) : (
            <ul className="event-progress">
              {upcoming.map((event) => (
                <li key={event._id}>
                  <Link href={`/organizer/events/${event._id}`}>
                    <Meter value={event.ticketsSold} max={event.capacity} label={event.title} />
                    <small>{formatShortDate(event.date)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        flush
        title="Recent orders"
        action={
          <Link className="text-link" href="/organizer/orders">
            All orders
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        }
      >
        {recentOrders.length === 0 ? (
          <p className="muted pad">No orders yet.</p>
        ) : (
          <OrdersTable orders={recentOrders} />
        )}
      </Panel>
    </>
  );
}
