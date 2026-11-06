"use client";

import { Download, Receipt } from "lucide-react";
import { useState } from "react";
import { OrdersTable } from "../../../../components/OrdersTable";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, SearchField } from "../../../../components/ui";
import * as api from "../../../../lib/api";
import { downloadCsv, formatShortDate } from "../../../../lib/format";
import { useResource } from "../../../../lib/useResource";

export default function OrganizerOrders() {
  const { data: orders, error, reload } = useResource(api.getOrganizerOrders);
  const [query, setQuery] = useState("");

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!orders) return <LoadingState />;

  const needle = query.toLowerCase();
  const shown = orders.filter((order) =>
    `${order.attendeeName} ${order.attendeeEmail} ${order.eventTitle}`.toLowerCase().includes(needle)
  );

  function exportOrders() {
    downloadCsv("BlockPass orders.csv", [
      ["Date", "Event", "Attendee", "Email", "Tier", "Quantity", "Value", "Status", "Order"],
      ...shown.map((order) => [
        formatShortDate(order.createdAt),
        order.eventTitle,
        order.attendeeName,
        order.attendeeEmail,
        order.tierName,
        order.quantity,
        order.totalPrice,
        order.status,
        order.reference,
      ]),
    ]);
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="Registrations across all your events."
        actions={
          <button className="btn secondary" onClick={exportOrders} disabled={shown.length === 0}>
            <Download size={16} aria-hidden="true" />
            Export CSV
          </button>
        }
      />
      {orders.length === 0 ? (
        <EmptyState icon={Receipt} title="No orders yet">
          Orders appear here as soon as attendees register.
        </EmptyState>
      ) : (
        <>
          <div className="toolbar">
            <SearchField value={query} onChange={setQuery} label="Search by attendee or event" />
          </div>
          <Panel flush>
            <OrdersTable orders={shown} />
          </Panel>
        </>
      )}
    </>
  );
}
