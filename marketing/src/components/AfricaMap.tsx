import { Reveal } from "./Reveal";
import africaMapSvg from "../assets/africa-map.svg?raw";
import { COUNTRY_MAPS } from "../data/countryMaps";

const MARKERS = [
  { city: "Lagos", country: "Nigeria", x: 30, y: 48 },
  { city: "Accra", country: "Ghana", x: 25, y: 50 },
  { city: "Dakar", country: "Senegal", x: 8, y: 30 },
  { city: "Cairo", country: "Egypt", x: 65, y: 11 },
  { city: "Addis Ababa", country: "Ethiopia", x: 68, y: 42 },
  { city: "Nairobi", country: "Kenya", x: 65, y: 58 },
  { city: "Kigali", country: "Rwanda", x: 58, y: 60 },
  { city: "Kinshasa", country: "DR Congo", x: 48, y: 62 },
  { city: "Johannesburg", country: "South Africa", x: 57, y: 83 },
];

const MARQUEE_ITEMS = [...COUNTRY_MAPS, ...COUNTRY_MAPS];

export function AfricaMap() {
  return (
    <section id="markets">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">Where We're Building</span>
          <h2 className="section-title">One platform, built for every stage across Africa</h2>
          <p className="section-sub">
            BlockPass isn't scoped to a single city. The same verified-ticket experience is
            designed to travel — from a concert hall in Lagos to a community gathering in
            Kigali.
          </p>
        </Reveal>

        <Reveal className="africa-map-visual">
          <div
            className="africa-map-svg"
            dangerouslySetInnerHTML={{ __html: africaMapSvg }}
            role="img"
            aria-label="Map of Africa with markers over BlockPass priority markets"
          />
          {MARKERS.map((m) => (
            <span
              key={m.city}
              className="africa-map-pin"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              title={`${m.city}, ${m.country}`}
            />
          ))}
        </Reveal>

        <Reveal delay={120} className="country-marquee-wrap">
          <p className="country-marquee-label">Priority markets</p>
          <div className="country-marquee">
            <div className="country-track">
              {MARQUEE_ITEMS.map((c, i) => (
                <div className="country-card" key={`${c.code}-${i}`} aria-hidden={i >= COUNTRY_MAPS.length}>
                  <svg viewBox={c.viewBox}>
                    <g transform={c.transform}>
                      <path d={c.path} />
                    </g>
                  </svg>
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
