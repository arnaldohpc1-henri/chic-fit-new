"use client";

import { useState } from "react";
import type { Product } from "@/lib/product-types";
import { formatPrice } from "@/lib/format";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartForm } from "@/components/AddToCartForm";

export function ProductView({ product }: { product: Product }) {
  const hasColors = product.colors.length > 0;
  const [colorIndex, setColorIndex] = useState<number | null>(
    product.colors.length === 1 ? 0 : null
  );

  const selectedColor = colorIndex !== null ? product.colors[colorIndex] : null;

  const galleryImages = selectedColor?.images.length
    ? selectedColor.images
    : product.images.length
      ? product.images
      : product.colors.find((c) => c.images.length > 0)?.images ?? [];

  const galleryKey = selectedColor ? selectedColor.name : "geral";

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {galleryImages.length > 0 ? (
        <ProductGallery
          key={galleryKey}
          images={galleryImages}
          alt={`${product.name}${selectedColor ? ` — ${selectedColor.name}` : ""}`}
        />
      ) : (
        <div className="aspect-[3/4] rounded-2xl bg-border" />
      )}

      <div>
        <p className="text-xs uppercase tracking-wide text-muted">
          {product.category}
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">
          {product.name}
        </h1>
        {!hasColors ? null : product.colors.length === 1 ? (
          <p className="mt-1 text-muted">Cor: {product.colors[0].name}</p>
        ) : (
          <p className="mt-1 text-muted">
            Cor: {selectedColor ? selectedColor.name : "selecione uma cor"}
          </p>
        )}
        <p className="mt-4 text-2xl font-medium">
          {formatPrice(product.price)}
        </p>

        {hasColors && product.colors.length > 1 && (
          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">
              Escolha a cor
            </p>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColorIndex(i)}
                  aria-label={`Ver cor ${c.name}`}
                  aria-pressed={colorIndex === i}
                  title={c.name}
                  style={{ backgroundColor: c.hex }}
                  className={`h-9 w-9 rounded-full border transition ${
                    colorIndex === i
                      ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
                      : "border-border/60 hover:ring-2 hover:ring-border hover:ring-offset-2 hover:ring-offset-background"
                  }`}
                />
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
            color={selectedColor?.name ?? null}
            image={galleryImages[0] ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
