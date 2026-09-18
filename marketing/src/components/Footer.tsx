import { Link } from "react-router-dom";
import { LogoMark } from "./Logo";

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="brand">
              <LogoMark size={30} />
              BlockPass
            </Link>
            <p>
              A digital event ticketing foundation on Stellar — every ticket minted as an
              authenticated, serialized on-chain asset.
            </p>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li>
                <Link to="/#how-it-works">How it works</Link>
              </li>
              <li>
                <Link to="/#features">Platform</Link>
              </li>
              <li>
                <Link to="/#markets">Where we're building</Link>
              </li>
              <li>
                <Link to="/#why-stellar">Why Stellar</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Organizers</h4>
            <ul>
              <li>
                <Link to="/#organizers">Host an event</Link>
              </li>
              <li>
                <Link to="/#faq">Pricing FAQ</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li>
                <Link to="/#faq">FAQ</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {YEAR} BlockPass. All rights reserved.</span>
        </div>

        <p className="photo-credits">
          Photos:{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:DAP_thrills_crowds_on_stage_at_Nativeland_music_festival,_Lagos,_December_2016.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Catherine Omeresan Sutherland
          </a>
          ,{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:Concert_Goers_in_Accra.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Owula kpakpo
          </a>
          , and{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:Innoss%27B_(21439814589).jpg"
            target="_blank"
            rel="noreferrer"
          >
            MONUSCO / Abel Kavanagh
          </a>
          ,{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:Chale_Wote_Street_Art_Festival_5.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Fquasie
          </a>
          , and{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:Kenya_mijikenda_traditional_dancers_gala_festival,_AfroCrowd_Wiki_project_15-12-2025.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Mijikendacribe
          </a>
          , via Wikimedia Commons (CC BY-SA). Africa basemap based on BlankMap-Africa (public
          domain), via Wikimedia Commons.
        </p>
      </div>
    </footer>
  );
}
