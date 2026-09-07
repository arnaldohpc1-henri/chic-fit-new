"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/product-types";
import { formatPrice } from "@/lib/format";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartForm } from "@/components/AddToCartForm";

export function ProductView({ product }: { product: Product }) {
  const [colorIndex, setColorIndex] = useState(0);
  const color = product.colors[colorIndex];

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <ProductGallery
        key={color.name}
        images={color.images}
        alt={`${product.name} — ${color.name}`}
      />

      <div>
        <p className="text-xs uppercase tracking-wide text-muted">
          {product.category}
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">
          {product.name}
        </h1>
        <p className="mt-1 text-muted">Cor: {color.name}</p>
        <p className="mt-4 text-2xl font-medium">
          {formatPrice(product.price)}
        </p>

        {product.colors.length > 1 && (
          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">
              Cor: {color.name}
            </p>
            <div className="flex gap-2">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColorIndex(i)}
                  aria-label={`Ver cor ${c.name}`}
                  className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 transition ${
                    colorIndex === i ? "border-accent" : "border-border"
                  }`}
                >
                  <Image
                    src={c.images[0]}
                    alt={c.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 leading-relaxed text-foreground/85">
          {product.description}
        </p>

        {product.details.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-muted">
            {product.details.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="text-accent">•</span>
                {d}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          <AddToCartForm
            product={product}
            color={color.name}
            image={color.images[0]}
          />
        </div>
      </div>
    </div>
  );
}
