"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);

  function scrollThumbs(amount: number) {
    thumbsRef.current?.scrollBy({ top: amount, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <div className="flex shrink-0 flex-col items-center gap-2 sm:w-20">
          {images.length > 4 && (
            <button
              type="button"
              onClick={() => scrollThumbs(-96)}
              aria-label="Ver fotos anteriores"
              className="hidden text-muted hover:text-accent sm:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
              </svg>
            </button>
          )}
          <div
            ref={thumbsRef}
            className="flex gap-3 overflow-x-auto sm:max-h-[440px] sm:flex-col sm:overflow-x-visible sm:overflow-y-auto"
          >
            {images.map((img, i) => (
              <button
                key={img}
                onClick={() => setActive(i)}
                className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  active === i ? "border-accent" : "border-transparent"
                }`}
                aria-label={`Ver foto ${i + 1}`}
              >
                <Image src={img} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
          {images.length > 4 && (
            <button
              type="button"
              onClick={() => scrollThumbs(96)}
              aria-label="Ver mais fotos"
              className="hidden text-muted hover:text-accent sm:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-2xl bg-border">
        <Image
          src={images[active]}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
