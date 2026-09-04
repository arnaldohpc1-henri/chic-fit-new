"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/config/site";

export function AddToCartForm({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (product.isDraft || product.price === null) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted">
          Essa peça ainda não está disponível para compra pelo site. Fale com a
          gente para saber preço, tamanhos e disponibilidade.
        </p>
        <a
          href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
            `Olá! Tenho interesse na peça "${product.name} - ${product.color}" que vi no site.`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-accent"
        >
          Perguntar no WhatsApp
        </a>
      </div>
    );
  }

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        color: product.color,
        size,
        price: product.price as number,
        image: product.images[0],
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-5">
      {product.sizes.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">
            Tamanho
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  size === s
                    ? "border-foreground bg-foreground text-white"
                    : "border-border hover:border-accent"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">
          Quantidade
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-9 w-9 rounded-full border border-border text-lg leading-none hover:border-accent"
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <span className="w-6 text-center">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="h-9 w-9 rounded-full border border-border text-lg leading-none hover:border-accent"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-accent"
        >
          {added ? "Adicionado!" : "Adicionar ao carrinho"}
        </button>
        <button
          type="button"
          onClick={() => {
            handleAdd();
            router.push("/carrinho");
          }}
          className="flex-1 rounded-full border border-foreground px-6 py-3 text-sm font-medium uppercase tracking-wide transition hover:border-accent hover:text-accent"
        >
          Comprar agora
        </button>
      </div>
    </div>
  );
}
