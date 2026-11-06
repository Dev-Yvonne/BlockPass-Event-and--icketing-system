"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import * as api from "../lib/api";
import { formatPrice } from "../lib/format";
import { EventItem } from "../types";

/** datetime-local works in the viewer's zone, so convert from the stored UTC. */
function toLocalInput(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export function EventForm({ event }: { event?: EventItem }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    category: event?.category ?? "",
    venue: event?.venue ?? "",
    date: event ? toLocalInput(event.date) : "",
    imageUrl: event?.imageUrl ?? "",
    gallery: (event?.gallery ?? []).join("\n"),
    highlights: (event?.highlights ?? []).join("\n"),
    schedule: (event?.schedule ?? []).map((item) => `${item.time} ${item.title}`).join("\n"),
    venueNotes: event?.venueNotes ?? "",
    localCurrency: event?.localCurrency ?? "KES",
  });
  const [tiers, setTiers] = useState([
    { name: "General Admission", description: "", price: 10, capacity: 100 },
  ]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateTier(index: number, change: Partial<(typeof tiers)[number]>) {
    setTiers((prev) => prev.map((tier, i) => (i === index ? { ...tier, ...change } : tier)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const input = {
      ...form,
      date: new Date(form.date).toISOString(),
      imageUrl: form.imageUrl || undefined,
      gallery: lines(form.gallery),
      highlights: lines(form.highlights),
      schedule: lines(form.schedule).map((line) => {
        const [time, ...title] = line.split(" ");
        return { time, title: title.join(" ") };
      }),
    };
    try {
      const saved = event
        ? await api.updateEvent(event._id, input)
        : await api.createEvent({ ...input, tiers });
      router.push(`/organizer/events/${saved._id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form form-sections">
      <section className="form-section">
        <h2>Event details</h2>
        <label className="field">
          Title
          <input value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </label>
        <label className="field">
          Description
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
          />
        </label>
        <div className="field-row">
          <label className="field">
            Category
            <input
              placeholder="Concert, Community, Conference"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              required
            />
          </label>
          <label className="field">
            Image URL (optional)
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Date and venue</h2>
        <div className="field-row">
          <label className="field">
            Date and time
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              required
            />
          </label>
          <label className="field">
            Venue
            <input value={form.venue} onChange={(e) => update("venue", e.target.value)} required />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Event page</h2>
        <label className="field">
          Gallery image URLs
          <textarea rows={3} value={form.gallery} onChange={(e) => update("gallery", e.target.value)} />
          <small>One URL per line.</small>
        </label>
        <label className="field">
          Highlights
          <textarea rows={3} value={form.highlights} onChange={(e) => update("highlights", e.target.value)} />
          <small>One highlight per line.</small>
        </label>
        <label className="field">
          Schedule
          <textarea
            rows={4}
            placeholder="18:00 Doors open"
            value={form.schedule}
            onChange={(e) => update("schedule", e.target.value)}
          />
          <small>One item per line, starting with the time.</small>
        </label>
        <label className="field">
          Venue notes
          <textarea rows={2} value={form.venueNotes} onChange={(e) => update("venueNotes", e.target.value)} />
        </label>
        <label className="field">
          Default local currency
          <select value={form.localCurrency} onChange={(e) => update("localCurrency", e.target.value)}>
            {["KES", "NGN", "GHS", "ZAR", "UGX", "TZS", "CDF"].map((code) => (
              <option key={code}>{code}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="form-section">
        <h2>Ticket tiers</h2>
        {event ? (
          <>
            <p className="muted">Tiers are fixed once an event is published.</p>
            <ul className="tier-summary">
              {event.tiers.map((tier) => (
                <li key={tier._id}>
                  <span>{tier.name}</span>
                  <span>
                    {formatPrice(tier.price)} · {tier.capacity} tickets
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            {tiers.map((tier, index) => (
              <div key={index} className="tier-row">
                <label className="field">
                  Name
                  <input
                    value={tier.name}
                    onChange={(e) => updateTier(index, { name: e.target.value })}
                    required
                  />
                </label>
                <label className="field">
                  Price ($)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={tier.price}
                    onChange={(e) => updateTier(index, { price: Number(e.target.value) })}
                    required
                  />
                </label>
                <label className="field">
                  Capacity
                  <input
                    type="number"
                    min={1}
                    value={tier.capacity}
                    onChange={(e) => updateTier(index, { capacity: Number(e.target.value) })}
                    required
                  />
                </label>
                {tiers.length > 1 && (
                  <button
                    type="button"
                    className="icon-btn outlined"
                    aria-label={`Remove ${tier.name || "tier"}`}
                    onClick={() => setTiers((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            {tiers.length < 6 && (
              <button
                type="button"
                className="btn secondary small"
                onClick={() =>
                  setTiers((prev) => [...prev, { name: "", description: "", price: 0, capacity: 50 }])
                }
              >
                <Plus size={15} aria-hidden="true" />
                Add tier
              </button>
            )}
          </>
        )}
      </section>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={() => router.back()}>
          Cancel
        </button>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Saving…" : event ? "Save changes" : "Publish event"}
        </button>
      </div>
    </form>
  );
}
