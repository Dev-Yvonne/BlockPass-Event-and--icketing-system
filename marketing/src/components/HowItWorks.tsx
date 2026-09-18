import { Reveal } from "./Reveal";

const STEPS = [
  {
    title: "Browse & buy",
    body: "Find an event and check out in seconds — no wallet setup, no crypto jargon. BlockPass handles the blockchain side for you.",
  },
  {
    title: "Ticket minted instantly",
    body: "The moment payment clears, your ticket is minted as a serialized asset on the Stellar ledger and assigned to your account.",
  },
  {
    title: "Show up with confidence",
    body: "Your ticket lives in your BlockPass account with a unique on-chain asset ID — impossible to duplicate or forge.",
  },
  {
    title: "One scan, verified forever",
    body: "Gate staff scan your ticket against the ledger. The first valid scan checks it in; every scan after that is instantly flagged.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">How It Works</span>
          <h2 className="section-title">From checkout to check-in, in four steps</h2>
          <p className="section-sub">
            A straightforward event checkout portal on the front end, an automated minting
            service on the back end.
          </p>
        </Reveal>

        <div className="steps">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 90} className="step-card">
              <div className="step-number">{String(i + 1).padStart(2, "0")}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
