import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as eventsApi from "../api/events";

export function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    venue: "",
    date: "",
    price: 0,
    capacity: 1,
    imageUrl: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const created = await eventsApi.createEvent(form);
      navigate(`/events/${created._id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Create Event</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Title
          <input value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
          />
        </label>
        <label>
          Category
          <input value={form.category} onChange={(e) => update("category", e.target.value)} required />
        </label>
        <label>
          Venue
          <input value={form.venue} onChange={(e) => update("venue", e.target.value)} required />
        </label>
        <label>
          Date &amp; time
          <input
            type="datetime-local"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            required
          />
        </label>
        <label>
          Price ($)
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => update("price", Number(e.target.value))}
            required
          />
        </label>
        <label>
          Capacity
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => update("capacity", Number(e.target.value))}
            required
          />
        </label>
        <label>
          Image URL (optional)
          <input value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} />
        </label>
        {error && <p className="status error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create event"}
        </button>
      </form>
    </div>
  );
}
