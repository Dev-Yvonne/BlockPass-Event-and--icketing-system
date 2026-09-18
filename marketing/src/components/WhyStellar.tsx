import { Reveal } from "./Reveal";

const POINTS = [
  "Ledger transactions settle in seconds, so a ticket is confirmed before the buyer's payment screen even closes.",
  "Network fees are a fraction of a cent, keeping minting costs low even for large, low-priced community events.",
  "Every ticket's ownership and check-in history is independently verifiable on a public ledger — not locked inside BlockPass's own database.",
];

export function WhyStellar() {
  return (
    <section id="why-stellar" className="stellar-section">
      <div className="container stellar-inner">
        <Reveal>
          <span className="eyebrow">Why Stellar</span>
          <h2 className="section-title">A ledger built for fast, low-cost, real-world assets</h2>
          <p className="section-sub" style={{ marginTop: 16 }}>
            BlockPass is currently minting tickets on the Stellar testnet as it builds toward a
            full production launch — the same network and contract logic that will power
            mainnet ticketing.
          </p>

          <ul className="stellar-list">
            {POINTS.map((point) => (
              <li key={point} className="stellar-list-item">
                <span className="check-badge">✓</span>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{point}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120} className="stat-grid">
          <div className="stat-card">
            <div className="stat-number">~5s</div>
            <div className="stat-label">Ledger finality</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">&lt;$0.001</div>
            <div className="stat-label">Typical network fee</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">1:1</div>
            <div className="stat-label">Ticket-to-asset ratio</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
