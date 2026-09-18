import { Ticket, Camera, BarChart3, LucideIcon } from "lucide-react";
import { Reveal } from "./Reveal";

const PROBLEMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Ticket,
    title: "Fake tickets in circulation",
    body: "Forged tickets and knockoff PDFs circulate freely before doors open, and by the time they're caught, the damage — refunds, disputes, angry fans — is already done.",
  },
  {
    icon: Camera,
    title: "Duplicate screenshots at the gate",
    body: "One screenshot, shared with five friends, becomes five people trying to use the same ticket. Gate staff have no reliable way to tell which one is real.",
  },
  {
    icon: BarChart3,
    title: "No transparency in sales",
    body: "Manual spreadsheets and closed ticketing portals leave organizers, sponsors, and fans with no shared, tamper-proof record of who actually holds a valid ticket.",
  },
];

export function Problem() {
  return (
    <section id="problem">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">Why BlockPass</span>
          <h2 className="section-title">Africa's live events run on trust — and that trust keeps breaking</h2>
          <p className="section-sub">
            Concerts and community events across Africa lose revenue and credibility to the same
            three failure points, event after event.
          </p>
        </Reveal>

        <div className="problem-grid">
          {PROBLEMS.map((item, i) => (
            <Reveal key={item.title} delay={i * 90} className="problem-card">
              <div className="problem-icon">
                <item.icon size={22} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
