import { Link2, ShieldCheck } from "lucide-react";
import { Reveal } from "./Reveal";

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-media">
        <img
          src="/images/hero-lagos-festival.jpg"
          alt="Crowd and performers at a live concert in Lagos, Nigeria"
        />
      </div>
      <div className="container hero-inner">
        <div>
          <Reveal>
            <h1 className="hero-title">
              Every ticket, <span className="accent-text">verified on-chain.</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="hero-sub">
              BlockPass mints each concert and event ticket as an authenticated, serialized
              asset on the Stellar blockchain — so fake tickets, duplicate screenshots at the
              gate, and spreadsheet chaos become a thing of the past.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="hero-ctas">
              <a href="#organizers" className="btn btn-primary btn-lg">
                Create Your Event
              </a>
              <a href="#get-started" className="btn btn-secondary btn-lg">
                Browse Events
              </a>
            </div>
          </Reveal>

        </div>

        <Reveal delay={160} className="ticket-wrap">
          <div className="ticket-card">
            <div className="ticket-top">
              <div>
                <div className="ticket-event">Nairobi Afrobeat Live</div>
                <div className="ticket-venue">Uhuru Gardens · Sat, 14 Mar</div>
              </div>
              <span className="ticket-status">Minted</span>
            </div>

            <div className="ticket-divider" />

            <div className="ticket-meta">
              <div>
                <div className="ticket-meta-label">Ticket Holder</div>
                <div className="ticket-meta-value">A. Mutiso</div>
              </div>
              <div>
                <div className="ticket-meta-label">Serial</div>
                <div className="ticket-meta-value">#00184</div>
              </div>
              <div>
                <div className="ticket-meta-label">Tier</div>
                <div className="ticket-meta-value">General Access</div>
              </div>
              <div>
                <div className="ticket-meta-label">Status</div>
                <div className="ticket-meta-value">Not checked in</div>
              </div>
            </div>

            <div className="ticket-chain">
              <div>
                <div className="ticket-chain-label">Asset ID</div>
                <div className="ticket-chain-id">CB3F…9E21 · token #184</div>
              </div>
              <Link2 size={18} className="icon" />
            </div>
          </div>

          <div className="ticket-float">
            <span className="ticket-float-icon">
              <ShieldCheck size={16} />
            </span>
            Authenticity verified in real time
          </div>
        </Reveal>
      </div>
    </section>
  );
}
