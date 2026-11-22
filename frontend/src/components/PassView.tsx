"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import * as api from "../lib/api";
import { formatDate, shorten } from "../lib/format";
import { Order } from "../types";
import { DynamicQr } from "./DynamicQr";
import { LogoMark } from "./Logo";

/** Picks up a check-in made at the gate while the pass is open. */
const STATUS_POLL_MS = 8_000;

function timeOf(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function PassView({ reference }: { reference: string }) {
  const params = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setOrder(await api.getPass(reference));
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }, [reference]);

  useEffect(() => {
    load();
    const timer = setInterval(load, STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Open on the ticket in the link, otherwise the first one not yet used.
  useEffect(() => {
    if (!order || index !== null) return;
    const wanted = Number(params.get("ticket"));
    const byLink = order.tickets.findIndex((t) => t.serial === wanted);
    const unused = order.tickets.findIndex((t) => !t.redemption);
    setIndex(byLink >= 0 ? byLink : Math.max(unused, 0));
  }, [order, index, params]);

  if (error && !order) {
    return (
      <PassFrame>
        <div className="pass-message">
          <CircleAlert aria-hidden="true" />
          <h1>Pass not found</h1>
          <p>Check the link in your confirmation, or open your tickets from your account.</p>
          <Link className="btn" href="/dashboard/tickets">
            My tickets
          </Link>
        </div>
      </PassFrame>
    );
  }
  if (!order || index === null) {
    return (
      <PassFrame>
        <div className="pass-message">
          <span className="spinner" aria-label="Loading pass" />
        </div>
      </PassFrame>
    );
  }
  if (order.status !== "confirmed") {
    return (
      <PassFrame>
        <div className="pass-message">
          <CircleAlert aria-hidden="true" />
          <h1>No tickets on this order</h1>
          <p>These tickets weren&apos;t issued, so there&apos;s nothing to show at the gate.</p>
          <Link className="btn" href={`/orders/${order.reference}`}>
            View order
          </Link>
        </div>
      </PassFrame>
    );
  }

  const ticket = order.tickets[index];
  const count = order.tickets.length;
  const redemption = ticket.redemption;

  return (
    <PassFrame>
      <article className="pass-card">
        {order.event.imageUrl && <img className="pass-photo" src={order.event.imageUrl} alt="" />}
        <div className="pass-head">
          <span className="ticket-tier">{order.tierName}</span>
          <h1>{order.event.title}</h1>
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

        {count > 1 && (
          <nav className="pass-switcher" aria-label="Tickets in this order">
            <button
              type="button"
              aria-label="Previous ticket"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <span>
              Ticket {index + 1} of {count}
            </span>
            <button
              type="button"
              aria-label="Next ticket"
              disabled={index === count - 1}
              onClick={() => setIndex(index + 1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </nav>
        )}

        <div className="pass-code">
          {redemption ? (
            <div className="pass-used" role="status">
              <CircleCheck aria-hidden="true" />
              <h2>Checked in</h2>
              <p>Admitted at {timeOf(redemption.admittedAt)}. This ticket can&apos;t be used again.</p>
              {redemption.txUrl ? (
                <a className="pass-proof-link" href={redemption.txUrl} target="_blank" rel="noreferrer">
                  Redemption on StellarExpert
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : (
                <span className="pass-pending">
                  <Loader2 size={14} className="spin" aria-hidden="true" />
                  Recording on Stellar
                </span>
              )}
            </div>
          ) : (
            <DynamicQr key={ticket.serial} reference={order.reference} serial={ticket.serial} onUsed={load} />
          )}
        </div>

        <dl className="pass-details">
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
          <div>
            <dt>Order</dt>
            <dd>
              <code>{order.reference}</code>
            </dd>
          </div>
        </dl>

        <section className="pass-proof" aria-label="Proof of ownership">
          <h2>
            <ShieldCheck size={16} aria-hidden="true" />
            Owned on Stellar testnet
          </h2>
          {order.stellar.txUrl && (
            <a className="btn full" href={order.stellar.txUrl} target="_blank" rel="noreferrer">
              View issue transaction
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          )}
          <ul>
            {order.stellar.txHash && (
              <li>
                <span>Transaction</span>
                <code>{shorten(order.stellar.txHash, 8)}</code>
              </li>
            )}
            <li>
              <span>Ticket asset</span>
              <a href={ticket.explorerUrl} target="_blank" rel="noreferrer">
                {ticket.assetCode}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </li>
            {order.stellar.attendeeUrl && order.stellar.attendeePublicKey && (
              <li>
                <span>Your wallet</span>
                <a href={order.stellar.attendeeUrl} target="_blank" rel="noreferrer">
                  {shorten(order.stellar.attendeePublicKey)}
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </li>
            )}
          </ul>
        </section>
      </article>

      <p className="pass-foot">
        <Link href={`/orders/${order.reference}`}>Receipt</Link>
        <span aria-hidden="true">·</span>
        <Link href={`/events/${order.event.id}`}>Event details</Link>
      </p>
    </PassFrame>
  );
}

function PassFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="pass-page">
      <header className="pass-bar">
        <Link href="/" className="pass-brand">
          <LogoMark size={26} />
          BlockPass
        </Link>
        <span className="pass-chip">Mobile pass</span>
      </header>
      <main className="pass-main">{children}</main>
    </div>
  );
}
