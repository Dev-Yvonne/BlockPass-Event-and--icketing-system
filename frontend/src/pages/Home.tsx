import { useEffect, useState } from "react";
import { EventItem } from "../types";
import * as eventsApi from "../api/events";
import { EventCard } from "../components/EventCard";

export function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    eventsApi
      .listEvents(search ? { search } : undefined)
      .then(setEvents)
      .catch(() => setError("Failed to load events"))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="page">
      <h1>Upcoming Events</h1>
      <input
        className="search-input"
        placeholder="Search events by title or venue…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading && <p className="status">Loading events…</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && events.length === 0 && <p className="status">No events found.</p>}
      <div className="event-grid">
        {events.map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>
    </div>
  );
}
