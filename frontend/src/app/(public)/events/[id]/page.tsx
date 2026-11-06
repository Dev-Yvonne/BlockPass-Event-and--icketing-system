import { CalendarDays, Check, Clock, MapPin, Navigation, ShieldCheck, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { CheckoutForm } from "../../../../components/CheckoutForm";
import { EventGallery } from "../../../../components/EventGallery";
import { Reviews } from "../../../../components/Reviews";
import { formatDate } from "../../../../lib/format";
import { getCheckoutOptions, getEvent } from "../../../../lib/server";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, options] = await Promise.all([getEvent(id), getCheckoutOptions()]);
  if (!event) notFound();

  const organizer = typeof event.organizer === "object" ? event.organizer.name : null;
  const images = [event.imageUrl, ...event.gallery].filter((src): src is string => !!src);

  return (
    <div className="event-page">
      {images.length > 0 && <EventGallery images={images} title={event.title} />}
      <div className="event-layout">
        <div className="event-summary">
          <span className="eyebrow">{event.category}</span>
          <h1>{event.title}</h1>
          <ul className="meta-list large">
            <li>
              <CalendarDays size={18} aria-hidden="true" />
              {formatDate(event.date)}
            </li>
            <li>
              <MapPin size={18} aria-hidden="true" />
              {event.venue}
            </li>
            {organizer && (
              <li>
                <UserRound size={18} aria-hidden="true" />
                Hosted by {organizer}
              </li>
            )}
          </ul>
        </div>

        <aside className="event-checkout" id="tickets">
          <CheckoutForm event={event} options={options!} />
        </aside>

        <div className="event-details">
          <section>
            <h2>About this event</h2>
            {event.description.split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </section>

          {event.highlights.length > 0 && (
            <section>
              <h2>Highlights</h2>
              <ul className="highlights">
                {event.highlights.map((highlight) => (
                  <li key={highlight}>
                    <Check size={16} aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {event.schedule.length > 0 && (
            <section>
              <h2>Schedule</h2>
              <ol className="schedule">
                {event.schedule.map((item) => (
                  <li key={`${item.time}${item.title}`}>
                    <time>
                      <Clock size={14} aria-hidden="true" />
                      {item.time}
                    </time>
                    <span>{item.title}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section>
            <h2>Venue</h2>
            <p className="venue-name">{event.venue}</p>
            {event.venueNotes && <p>{event.venueNotes}</p>}
            <a
              className="inline-link venue-link"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation size={14} aria-hidden="true" />
              Open in Maps
            </a>
          </section>

          <section className="assurance">
            <ShieldCheck size={22} aria-hidden="true" />
            <div>
              <h2>Your ticket is one of a kind</h2>
              <p>
                Each ticket is issued as a unique asset on the Stellar testnet, with a serial number
                and a public record. You don't need a crypto wallet.
              </p>
            </div>
          </section>

          <Reviews eventId={event._id} />
        </div>
      </div>
    </div>
  );
}
