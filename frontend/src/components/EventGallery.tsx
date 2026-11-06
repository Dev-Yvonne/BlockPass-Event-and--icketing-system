"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Photo mosaic that opens into a full-size viewer. */
export function EventGallery({ images, title }: { images: string[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  const step = (by: number) => setActive((active + by + images.length) % images.length);

  return (
    <>
      <div className={`gallery count-${Math.min(images.length, 5)}`}>
        {images.slice(0, 5).map((src, index) => (
          <button
            key={src}
            type="button"
            aria-label={`View photo ${index + 1} of ${images.length}`}
            onClick={() => {
              setActive(index);
              setOpen(true);
            }}
          >
            <img src={src} alt="" />
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={`${title} photos`}
        onClose={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
      >
        <img src={images[active]} alt={`${title}, photo ${active + 1}`} />
        <button className="lightbox-close" aria-label="Close" onClick={() => setOpen(false)}>
          <X size={20} aria-hidden="true" />
        </button>
        {images.length > 1 && (
          <>
            <button className="lightbox-prev" aria-label="Previous photo" onClick={() => step(-1)}>
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button className="lightbox-next" aria-label="Next photo" onClick={() => step(1)}>
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
