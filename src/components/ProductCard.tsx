"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/product-types";
import { formatPrice } from "@/lib/format";

const CYCLE_MS = 900;

export function ProductCard({ product }: { product: Product }) {
  const hasColors = product.colors.length > 0;
  const [activeColor, setActiveColor] = useState(0);
  const [imgIndex, setImgIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const color = hasColors ? product.colors[activeColor] : null;
  const displayImages = color?.images.length ? color.images : product.images;
  const colorLabel = color?.name ?? "";

  function startCycle() {
    if (displayImages.length <= 1) return;
    stopCycle();
    intervalRef.current = setInterval(() => {
      setImgIndex((i) => (i + 1) % displayImages.length);
    }, CYCLE_MS);
  }

  function stopCycle() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setImgIndex(0);
  }

  // Em telas sem mouse (celular/tablet) não existe hover, então a peça
  // alterna as fotos sozinha para manter a vitrine interativa também lá.
  useEffect(() => {
    if (displayImages.length <= 1) return;
    const hasHover = window.matchMedia("(hover: hover)").matches;
    if (hasHover) return;
    const id = setInterval(() => {
      setImgIndex((i) => (i + 1) % displayImages.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [color, displayImages.length]);

  return (
    <div className="group block overflow-hidden rounded-2xl bg-card">
      <Link
        href={`/produto/${product.slug}`}
        onMouseEnter={startCycle}
        onMouseLeave={stopCycle}
        className="relative block aspect-[3/4] overflow-hidden bg-border"
      >
        {displayImages.map((img, i) => (
          <Image
            key={img}
            src={img}
            alt={`${product.name}${colorLabel ? ` — ${colorLabel}` : ""}`}
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
        {displayImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {displayImages.map((_, i) => (
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
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-medium">{formatPrice(product.price)}</p>
          {hasColors && (
            <div className="flex gap-1.5">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={(e) => {
                    e.preventDefault();
                    stopCycle();
                    setActiveColor(i);
                  }}
                  aria-label={`Ver cor ${c.name}`}
                  style={{ backgroundColor: c.hex }}
                  className={`h-5 w-5 shrink-0 rounded-full border transition ${
                    activeColor === i
                      ? "border-accent ring-2 ring-accent ring-offset-1 ring-offset-card"
                      : "border-border/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
