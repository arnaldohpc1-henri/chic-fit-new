"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";

const CYCLE_MS = 900;

export function ProductCard({ product }: { product: Product }) {
  const [activeColor, setActiveColor] = useState(0);
  const [imgIndex, setImgIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const color = product.colors[activeColor];

  function startCycle() {
    if (color.images.length <= 1) return;
    stopCycle();
    intervalRef.current = setInterval(() => {
      setImgIndex((i) => (i + 1) % color.images.length);
    }, CYCLE_MS);
  }

  function stopCycle() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setImgIndex(0);
  }

  return (
    <div className="group block overflow-hidden rounded-2xl bg-card">
      <Link
        href={`/produto/${product.slug}`}
        onMouseEnter={startCycle}
        onMouseLeave={stopCycle}
        className="relative block aspect-[3/4] overflow-hidden bg-border"
      >
        {color.images.map((img, i) => (
          <Image
            key={img}
            src={img}
            alt={`${product.name} — ${color.name}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={`object-cover transition-opacity duration-300 group-hover:scale-105 ${
              i === imgIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {product.isDraft && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-3 py-1 text-[11px] uppercase tracking-wide text-white">
            Em breve
          </span>
        )}
        {color.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {color.images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === imgIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </Link>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted">
          {product.category}
        </p>
        <Link href={`/produto/${product.slug}`}>
          <h3 className="mt-1 font-display text-lg leading-tight hover:text-accent">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-muted">{color.name}</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-medium">{formatPrice(product.price)}</p>
          {product.colors.length > 1 && (
            <div className="flex gap-1">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    stopCycle();
                    setActiveColor(i);
                  }}
                  aria-label={`Ver cor ${c.name}`}
                  className={`relative h-6 w-6 overflow-hidden rounded-full border-2 transition ${
                    activeColor === i ? "border-accent" : "border-transparent"
                  }`}
                >
                  <Image src={c.images[0]} alt="" fill sizes="24px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}