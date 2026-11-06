import Link from "next/link";
import { LogoMark } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <span className="brand">
            <LogoMark />
            BlockPass
          </span>
          <p>Events across Africa, with tickets that can't be copied.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/#events">Find events</Link>
          <Link href="/ledger">Ticket ledger</Link>
          <a href="/images/CREDITS.md">Photo credits</a>
        </nav>
      </div>
      <p className="site-footer-note">
        Test mode. Tickets and stablecoin payments run on the Stellar testnet, local payments run in a
        sandbox, and no real money moves. Demo events are fictional. Event photos by Wikimedia Commons
        contributors, used under Creative Commons licenses.
      </p>
    </footer>
  );
}
