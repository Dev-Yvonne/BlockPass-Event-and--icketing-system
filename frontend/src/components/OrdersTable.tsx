import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatPrice, formatShortDate } from "../lib/format";
import { OrderRow } from "../types";
import { OrderBadge } from "./ui";

/** Orders as a table on wide screens and stacked rows on phones. */
export function OrdersTable({ orders, showEvent = true }: { orders: OrderRow[]; showEvent?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Attendee</th>
            {showEvent && <th scope="col">Event</th>}
            <th scope="col">Tickets</th>
            <th scope="col">Value</th>
            <th scope="col">Status</th>
            <th scope="col">Date</th>
            <th scope="col">
              <span className="sr-only">Links</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.reference}>
              <td data-label="Attendee">
                <span className="cell-title">{order.attendeeName}</span>
                <span className="cell-sub">{order.attendeeEmail}</span>
              </td>
              {showEvent && <td data-label="Event">{order.eventTitle}</td>}
              <td data-label="Tickets">
                {order.quantity} × {order.tierName}
              </td>
              <td data-label="Value">{formatPrice(order.totalPrice)}</td>
              <td data-label="Status">
                <OrderBadge status={order.status} />
              </td>
              <td data-label="Date">{formatShortDate(order.createdAt)}</td>
              <td className="cell-actions">
                <Link href={`/orders/${order.reference}`}>Open</Link>
                {order.txUrl && (
                  <a href={order.txUrl} target="_blank" rel="noreferrer" aria-label="View transaction on StellarExpert">
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
