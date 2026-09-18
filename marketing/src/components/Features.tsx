import { Reveal } from "./Reveal";

const FEATURES = [
  {
    icon: "🧾",
    title: "Authenticated serialized assets",
    body: "Every ticket is a uniquely serialized on-chain asset tied to a specific event and seat — not a copyable PDF or screenshot.",
  },
  {
    icon: "⚡",
    title: "Real-time minting",
    body: "Tickets are minted the instant a purchase completes, triggered directly from checkout with no manual batch processing.",
  },
  {
    icon: "🚪",
    title: "One-time check-in",
    body: "Each ticket can be checked in exactly once. A second attempt — the classic duplicate-screenshot scam — is rejected automatically.",
  },
  {
    icon: "🔍",
    title: "Transparent sales ledger",
    body: "Organizers and sponsors see a live, tamper-proof record of every ticket sold — no more reconciling spreadsheets after the fact.",
  },
  {
    icon: "🪐",
    title: "Built on Stellar",
    body: "Stellar's ledger settles in seconds at a fraction of a cent per transaction, so minting at scale stays fast and affordable.",
  },
  {
    icon: "🔑",
    title: "No crypto knowledge required",
    body: "BlockPass manages secure custodial wallets behind the scenes, so fans and organizers get blockchain guarantees without needing a seed phrase.",
  },
];

export function Features() {
  return (
    <section id="features">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">Platform</span>
          <h2 className="section-title">Everything a fraud-proof box office needs</h2>
          <p className="section-sub">
            BlockPass is the ticketing foundation — minting, checkout, and check-in built as one
            connected system.
          </p>
        </Reveal>

        <div className="features-grid">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 90} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
