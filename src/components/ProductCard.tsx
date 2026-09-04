"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const [activeColor, setActiveColor] = useState(0);
  const color = product.colors[activeColor];

  return (
    <div className="group block overflow-hidden rounded-2xl bg-card">
      <Link
        href={`/produto/${product.slug}`}
        className="relative block aspect-[3/4] overflow-hidden bg-border"
      >
        <Image
          src={color.images[0]}
          alt={`${product.name} — ${color.name}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.isDraft && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-3 py-1 text-[11px] uppercase tracking-wide text-white">
            Em breve
          </span>
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
