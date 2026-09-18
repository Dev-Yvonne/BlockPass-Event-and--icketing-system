import { Reveal } from "./Reveal";

export function ForOrganizers() {
  return (
    <section id="organizers">
      <div className="container organizers-inner">
        <Reveal>
          <span className="eyebrow">For Event Organizers</span>
          <h2 className="section-title">Run your box office on a ledger, not a spreadsheet</h2>
          <p className="section-sub" style={{ marginBottom: 28 }}>
            Launch an event, set your pricing and capacity, and let BlockPass mint and track
            every ticket automatically — with a live view of exactly what's been sold.
          </p>
          <div className="hero-ctas">
            <a href="#get-started" className="btn btn-primary">
              Host Your Event
            </a>
            <a href="#faq" className="btn btn-ghost">
              How pricing works
            </a>
          </div>
        </Reveal>

        <Reveal delay={120} className="organizer-panel">
          <div className="organizer-row">
            <span>Event setup</span>
            <span>Minutes, not days</span>
          </div>
          <div className="organizer-row">
            <span>Ticket issuance</span>
            <span>Automated on-chain</span>
          </div>
          <div className="organizer-row">
            <span>Duplicate check-ins</span>
            <span>Blocked automatically</span>
          </div>
          <div className="organizer-row">
            <span>Sales visibility</span>
            <span>Live, tamper-proof ledger</span>
          </div>
          <div className="organizer-row">
            <span>Organizer dashboard</span>
            <span>Coming next</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
