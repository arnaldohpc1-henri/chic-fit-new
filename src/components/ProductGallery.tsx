"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-border">
        <Image
          src={images[active]}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              className={`relative h-20 w-16 overflow-hidden rounded-lg border-2 transition ${
                active === i ? "border-accent" : "border-transparent"
              }`}
              aria-label={`Ver foto ${i + 1}`}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
