import { Reveal } from "./Reveal";

export function CtaBand() {
  return (
    <section id="get-started">
      <div className="container">
        <Reveal className="cta-band">
          <h2>Ready to end fake tickets at your next event?</h2>
          <p>
            Join the organizers and fans building the fraud-proof way to buy, sell, and scan
            event tickets in Kenya.
          </p>
          <div className="cta-actions">
            <a href="#" className="btn btn-primary btn-lg">
              Get Verified Tickets
            </a>
            <a href="#organizers" className="btn btn-ghost btn-lg">
              Host an Event
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
