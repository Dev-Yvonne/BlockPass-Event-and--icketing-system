import { CircleAlert, CircleCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketCard } from "../../../../components/TicketCard";
import { formatMoney, formatPrice, shorten } from "../../../../lib/format";
import { getOrder } from "../../../../lib/server";

const PAYMENT_LABEL = {
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Not charged",
};

export default async function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = await getOrder(reference);
  if (!order) notFound();

  const confirmed = order.status === "confirmed";

  return (
    <div className="order-page">
      <div className={confirmed ? "order-alert success" : "order-alert failure"} role="status">
        {confirmed ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
        <div>
          <h1>{confirmed ? "Your tickets are issued" : "Your tickets weren't issued"}</h1>
          <p>
            {confirmed
              ? `${order.quantity} ${order.quantity === 1 ? "ticket" : "tickets"} issued to ${order.attendeeName} (${order.attendeeEmail}) on the Stellar testnet.`
              : order.status === "failed"
                ? "Stellar didn't accept this order, so your tickets were released. Please try again."
                : "This order is still being processed."}
          </p>
        </div>
      </div>

      {confirmed && (
        <div className="order-tickets">
          {order.tickets.map((ticket) => (
            <TicketCard key={ticket.assetCode} order={order} ticket={ticket} />
          ))}
        </div>
      )}

      <section className="receipt-card">
        <h2>Receipt</h2>
        <dl className="receipt">
          <div>
            <dt>Order</dt>
            <dd>
              <code>{order.reference}</code>
            </dd>
          </div>
          <div>
            <dt>Tickets</dt>
            <dd>
              {order.quantity} × {order.tierName}
            </dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatPrice(order.totalPrice)}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>
              {PAYMENT_LABEL[order.payment.status]}: {formatMoney(order.payment.amount, order.payment.currency)}
              {order.payment.method === "stablecoin"
                ? " on Stellar testnet"
                : ` by mobile money (sandbox ${order.payment.reference ?? ""})`}
            </dd>
          </div>
          {confirmed && (
            <>
              <div>
                <dt>Status</dt>
                <dd>Confirmed in ledger {order.stellar.ledger}</dd>
              </div>
              <div>
                <dt>Transaction hash</dt>
                <dd>
                  <code className="hash">{order.stellar.txHash}</code>
                </dd>
              </div>
              <div>
                <dt>Your wallet</dt>
                <dd>
                  <a href={order.stellar.attendeeUrl ?? undefined} target="_blank" rel="noreferrer">
                    {shorten(order.stellar.attendeePublicKey ?? "", 8)}
                  </a>
                </dd>
              </div>
            </>
          )}
        </dl>
        <div className="receipt-actions">
          {confirmed && (
            <a className="btn" href={order.stellar.txUrl ?? undefined} target="_blank" rel="noreferrer">
              View on StellarExpert
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
          <Link className="btn secondary" href={`/events/${order.event.id}`}>
            Back to event
          </Link>
        </div>
      </section>
    </div>
  );
}
