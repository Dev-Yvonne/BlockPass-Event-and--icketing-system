import { CalendarDays, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { formatDate, isPast } from "../lib/format";
import { Order } from "../types";

/** One physical ticket: event on the main body, identity on the stub. */
export function TicketCard({
  order,
  ticket,
  showReceipt,
}: {
  order: Order;
  ticket: Order["tickets"][number];
  showReceipt?: boolean;
}) {
  return (
    <article className="ticket">
      <div className="ticket-main">
        {order.event.imageUrl && <img className="ticket-photo" src={order.event.imageUrl} alt="" />}
        <div className="ticket-body">
          <span className="ticket-tier">{order.tierName}</span>
          <h3>{order.event.title}</h3>
          <ul className="meta-list">
            <li>
              <CalendarDays size={15} aria-hidden="true" />
              {formatDate(order.event.date)}
            </li>
            <li>
              <MapPin size={15} aria-hidden="true" />
              {order.event.venue}
            </li>
          </ul>
        </div>
      </div>
      <div className="ticket-stub">
        <dl>
          <div>
            <dt>Admit</dt>
            <dd>{order.attendeeName}</dd>
          </div>
          <div>
            <dt>Serial</dt>
            <dd>{String(ticket.serial).padStart(6, "0")}</dd>
          </div>
          <div>
            <dt>Ticket code</dt>
            <dd>
              <code>{ticket.assetCode}</code>
            </dd>
          </div>
        </dl>
        <div className="ticket-links">
          <span className="ticket-verified">
            <ShieldCheck size={15} aria-hidden="true" />
            On Stellar testnet
          </span>
          <a href={ticket.explorerUrl} target="_blank" rel="noreferrer">
            Verify
            <ExternalLink size={13} aria-hidden="true" />
          </a>
          {showReceipt && <Link href={`/orders/${order.reference}`}>Receipt</Link>}
          {showReceipt && isPast(order.event.date) && (
            <Link href={`/events/${order.event.id}#reviews`}>Leave a review</Link>
          )}
        </div>
      </div>
    </article>
  );
}
