"use client";

import { useState } from "react";
import { OrdersTable } from "../../../../components/OrdersTable";
import { ErrorState, LoadingState, PageHeader, Panel, SearchField } from "../../../../components/ui";
import * as api from "../../../../lib/api";
import { useResource } from "../../../../lib/useResource";
import { OrderStatus } from "../../../../types";

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Issued" },
  { value: "failed", label: "Failed" },
];

export default function AdminOrders() {
  const { data: orders, error, reload } = useResource(api.getAdminOrders);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!orders) return <LoadingState />;

  const needle = query.toLowerCase();
  const shown = orders.filter(
    (order) =>
      (status === "all" || order.status === status) &&
      `${order.attendeeName} ${order.attendeeEmail} ${order.eventTitle} ${order.reference}`
        .toLowerCase()
        .includes(needle)
  );

  return (
    <>
      <PageHeader title="Orders" description="The 200 most recent orders across the platform." />
      <div className="toolbar">
        <SearchField value={query} onChange={setQuery} label="Search by attendee, event or order" />
        <div className="segmented" role="group" aria-label="Filter by status">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              className={status === filter.value ? "active" : ""}
              aria-pressed={status === filter.value}
              onClick={() => setStatus(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <Panel flush>
        {shown.length === 0 ? <p className="muted pad">No orders match.</p> : <OrdersTable orders={shown} />}
      </Panel>
    </>
  );
}
