"use client";

import { Coins, LoaderCircle, Minus, Plus, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as api from "../lib/api";
import { formatMoney, formatPrice } from "../lib/format";
import { CheckoutOptions, EventItem, PaymentMethod } from "../types";

const MAX_PER_ORDER = 10;

export function CheckoutForm({ event, options }: { event: EventItem; options: CheckoutOptions }) {
  const router = useRouter();
  const { user } = useAuth();
  const firstAvailable = event.tiers.find((tier) => tier.remaining > 0);
  const [tierId, setTierId] = useState(firstAvailable?._id ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>("local");
  const [currency, setCurrency] = useState(event.localCurrency);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // One key per attempt: a double click reuses it, a retry after failure doesn't.
  const checkoutId = useRef("");

  useEffect(() => {
    if (user) {
      setName((current) => current || user.name);
      setEmail((current) => current || user.email);
    }
  }, [user]);

  const tier = event.tiers.find((candidate) => candidate._id === tierId);
  const eventPassed = new Date(event.date).getTime() <= Date.now();
  const maxQuantity = Math.min(tier?.remaining ?? 1, MAX_PER_ORDER);
  const total = (tier?.price ?? 0) * quantity;
  const payable =
    method === "local"
      ? formatMoney(total * options.rates[currency], currency)
      : formatMoney(total, options.stablecoin);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    checkoutId.current ||= crypto.randomUUID();
    try {
      const order = await api.checkout({
        eventId: event._id,
        tierId,
        name,
        email,
        quantity,
        checkoutId: checkoutId.current,
        paymentMethod: method,
        ...(method === "local" ? { currency, phone } : {}),
      });
      router.push(`/orders/${order.reference}`);
    } catch (err) {
      checkoutId.current = "";
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (eventPassed || !firstAvailable) {
    return (
      <div className="checkout-closed">
        <h2>{eventPassed ? "This event has ended" : "Sold out"}</h2>
        <p>{eventPassed ? "Tickets are no longer available." : "All tickets have been issued."}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="checkout form" aria-busy={submitting}>
      <h2>Get tickets</h2>

      <fieldset className="tier-options" disabled={submitting}>
        <legend>Ticket type</legend>
        {event.tiers.map((option) => (
          <label
            key={option._id}
            className={`tier${option._id === tierId ? " selected" : ""}${option.remaining === 0 ? " unavailable" : ""}`}
          >
            <input
              type="radio"
              name="tier"
              value={option._id}
              checked={option._id === tierId}
              disabled={option.remaining === 0}
              onChange={() => {
                setTierId(option._id);
                setQuantity(1);
              }}
            />
            <span className="tier-name">
              {option.name}
              {option.description && <small>{option.description}</small>}
            </span>
            <span className="tier-price">
              {formatPrice(option.price)}
              <small>{option.remaining > 0 ? `${option.remaining} left` : "Sold out"}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="field">
        Full name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          minLength={2}
          maxLength={80}
          required
          disabled={submitting}
        />
      </label>
      <label className="field">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={submitting}
        />
      </label>

      <div className="quantity-row">
        <span id="quantity-label">Quantity</span>
        <div className="stepper" role="group" aria-labelledby="quantity-label">
          <button
            type="button"
            aria-label="Remove one ticket"
            disabled={submitting || quantity <= 1}
            onClick={() => setQuantity(quantity - 1)}
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <output aria-live="polite">{quantity}</output>
          <button
            type="button"
            aria-label="Add one ticket"
            disabled={submitting || quantity >= maxQuantity}
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <fieldset className="pay-options" disabled={submitting}>
        <legend>Pay with</legend>
        <label className={method === "local" ? "selected" : ""}>
          <input type="radio" name="payment" checked={method === "local"} onChange={() => setMethod("local")} />
          <Smartphone size={18} aria-hidden="true" />
          <span>
            Local currency
            <small>Mobile money</small>
          </span>
        </label>
        <label className={method === "stablecoin" ? "selected" : ""}>
          <input type="radio" name="payment" checked={method === "stablecoin"} onChange={() => setMethod("stablecoin")} />
          <Coins size={18} aria-hidden="true" />
          <span>
            Stablecoin
            <small>On Stellar</small>
          </span>
        </label>
      </fieldset>

      {method === "local" ? (
        <div className="pay-fields">
          <label className="field">
            Currency
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={submitting}>
              {Object.keys(options.rates).map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Mobile money number
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+254 700 000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={submitting}
            />
          </label>
        </div>
      ) : (
        <p className="form-note left">
          Paid from your BlockPass wallet in {options.stablecoin}, a test stablecoin, in the same
          Stellar transaction that issues your tickets.
        </p>
      )}

      <div className="checkout-total">
        <span>Total</span>
        <div>
          <strong>{payable}</strong>
          {method === "local" && <small>{formatPrice(total)} at a fixed test rate</small>}
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn full" disabled={submitting}>
        {submitting ? (
          <>
            <LoaderCircle className="spin" size={18} aria-hidden="true" />
            Processing your order…
          </>
        ) : (
          `Pay ${payable}`
        )}
      </button>
      <p className="form-note" role="status">
        {submitting
          ? "This usually takes under 20 seconds. Please keep this page open."
          : "Test mode: no real money moves."}
      </p>
    </form>
  );
}
