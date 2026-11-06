import { ArrowRight, CalendarPlus, Compass, Search, ShieldCheck, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { EventCard } from "../../components/EventCard";
import { listEvents } from "../../lib/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { search, category } = await searchParams;
  const [all, matching] = await Promise.all([listEvents(), listEvents(search, category)]);
  const categories = [...new Set(all.map((event) => event.category))];

  return (
    <>
      <section className="hero">
        <img className="hero-photo" src="/images/lagos-live-nights.jpg" alt="" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Find your next event, or host your own</h1>
          <p>
            Concerts, festivals and community gatherings across Africa, with tickets that can't be
            copied or shared as screenshots.
          </p>
          <div className="hero-actions">
            <Link className="btn large" href="#events">
              <Compass size={18} aria-hidden="true" />
              Find events
            </Link>
            <Link className="btn large light" href="/register?role=organizer">
              <CalendarPlus size={18} aria-hidden="true" />
              Host an event
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="events">
        <div className="section-head">
          <h2>Upcoming events</h2>
          <form role="search" action="/#events" className="event-search">
            <Search size={17} aria-hidden="true" />
            <input
              name="search"
              type="search"
              aria-label="Search events by title or venue"
              placeholder="Search by event or venue"
              defaultValue={search}
            />
            {category && <input type="hidden" name="category" value={category} />}
          </form>
        </div>

        {categories.length > 1 && (
          <nav className="chips" aria-label="Filter by category">
            <Link href="/#events" className={category ? "chip" : "chip active"}>
              All
            </Link>
            {categories.map((name) => (
              <Link
                key={name}
                href={`/?category=${encodeURIComponent(name)}#events`}
                className={category === name ? "chip active" : "chip"}
              >
                {name}
              </Link>
            ))}
          </nav>
        )}

        {matching.length === 0 ? (
          <p className="no-results">
            No events match your search. <Link href="/#events">See all events</Link>
          </p>
        ) : (
          <div className="event-grid">
            {matching.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="section two-sided">
        <article>
          <Ticket size={24} aria-hidden="true" />
          <h2>For attendees</h2>
          <p>
            Pay in local currency or with stablecoins on Stellar, with no crypto wallet to set up.
            Each ticket has its own serial number and a public record that proves it's genuine.
          </p>
          <ul>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />A unique ticket, not a copyable image
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              All your tickets in one place
            </li>
          </ul>
          <Link href="/register" className="text-link">
            Create an account
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>
        <article>
          <Users size={24} aria-hidden="true" />
          <h2>For organizers</h2>
          <p>
            Publish an event, set your ticket tiers and watch sales as they happen, without
            spreadsheets or manual reconciliation.
          </p>
          <ul>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              Capacity that can't be oversold
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              Attendee lists ready to export
            </li>
          </ul>
          <Link href="/register?role=organizer" className="text-link">
            Start hosting
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>
      </section>
    </>
  );
}
