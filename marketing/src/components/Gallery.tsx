import { Reveal } from "./Reveal";

const MOSAIC_PHOTOS = [
  {
    src: "/images/hero-lagos-festival.jpg",
    caption: "Lagos, Nigeria",
    size: "gallery-big",
  },
  {
    src: "/images/gallery-drc-stage.jpg",
    caption: "Kinshasa, DR Congo",
    size: "gallery-tall",
  },
  {
    src: "/images/gallery-ghana-chalewote.jpg",
    caption: "Accra, Ghana — Chale Wote Street Art Festival",
    size: "gallery-small",
  },
  {
    src: "/images/gallery-kenya-mijikenda.jpg",
    caption: "Kilifi, Kenya — Mijikenda cultural festival",
    size: "gallery-small",
  },
];

const BANNER_PHOTO = { src: "/images/cta-accra-crowd.jpg", caption: "Accra, Ghana" };

export function Gallery() {
  return (
    <section id="gallery">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">Across Africa</span>
          <h2 className="section-title">The events BlockPass is building for</h2>
          <p className="section-sub">
            From arena stages to street festivals and community gatherings, this is the energy
            a fraud-proof ticket has to keep up with — in cities across the continent.
          </p>
        </Reveal>

        <div className="gallery-grid">
          {MOSAIC_PHOTOS.map((photo, i) => (
            <Reveal
              key={photo.src}
              delay={i * 90}
              className={`gallery-item ${photo.size}`}
            >
              <img src={photo.src} alt={`Live event crowd in ${photo.caption}`} loading="lazy" />
              <span className="gallery-caption">{photo.caption}</span>
            </Reveal>
          ))}
        </div>

        <Reveal delay={280} className="gallery-item gallery-banner">
          <img
            src={BANNER_PHOTO.src}
            alt={`Live event crowd in ${BANNER_PHOTO.caption}`}
            loading="lazy"
          />
          <span className="gallery-caption">{BANNER_PHOTO.caption}</span>
        </Reveal>
      </div>
    </section>
  );
}
