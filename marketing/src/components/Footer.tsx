const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#top" className="brand">
              <span className="brand-mark">BP</span>
              BlockPass
            </a>
            <p>
              A digital event ticketing foundation on Stellar — every ticket minted as an
              authenticated, serialized on-chain asset.
            </p>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li>
                <a href="#how-it-works">How it works</a>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#why-stellar">Why Stellar</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Organizers</h4>
            <ul>
              <li>
                <a href="#organizers">Host an event</a>
              </li>
              <li>
                <a href="#faq">Pricing FAQ</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#faq">FAQ</a>
              </li>
              <li>
                <a href="mailto:hello@blockpass.app">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {YEAR} BlockPass. All rights reserved.</span>
          <span className="testnet-note">⛓ Currently minting on Stellar Testnet</span>
        </div>
      </div>
    </footer>
  );
}
