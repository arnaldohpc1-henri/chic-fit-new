"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

export default function CarrinhoPage() {
  const { items, removeItem, setQty, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl">Seu carrinho está vazio</h1>
        <p className="mt-3 text-muted">
          Que tal dar uma olhada nas nossas peças?
        </p>
        <Link
          href="/loja"
          className="mt-8 inline-block rounded-full bg-foreground px-8 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-accent"
        >
          Ir para a loja
        </Link>
      </div>
    );
  }

  const missingFreeShipping = Math.max(
    0,
    siteConfig.freeShippingThreshold - subtotal
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="mb-8 font-display text-3xl">Carrinho</h1>

      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.color}-${item.size}`}
            className="flex gap-4 p-4 sm:p-5"
          >
            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-border">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between gap-2">
                <div>
                  <Link
                    href={`/produto/${item.slug}`}
                    className="font-medium hover:text-accent"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {item.color}
                    {item.size ? ` · Tam. ${item.size}` : ""}
                  </p>
                </div>
                <p className="font-medium">
                  {formatPrice(item.price * item.qty)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setQty(item.productId, item.color, item.size, item.qty - 1)
                    }
                    className="h-8 w-8 rounded-full border border-border hover:border-accent"
                    aria-label="Diminuir quantidade"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm">{item.qty}</span>
                  <button
                    onClick={() =>
                      setQty(item.productId, item.color, item.size, item.qty + 1)
                    }
                    className="h-8 w-8 rounded-full border border-border hover:border-accent"
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.color, item.size)}
                  className="text-sm text-muted underline-offset-2 hover:text-accent hover:underline"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        {missingFreeShipping > 0 ? (
          <p className="mb-4 text-sm text-muted">
            Faltam {formatPrice(missingFreeShipping)} para frete grátis.
          </p>
        ) : (
          <p className="mb-4 text-sm text-accent">
            Você ganhou frete grátis! 🎉
          </p>
        )}
        <div className="flex items-center justify-between text-lg">
          <span>Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Frete e prazo de entrega calculados no checkout.
        </p>
        <Link
          href="/checkout"
          className="mt-6 block rounded-full bg-foreground px-6 py-3 text-center text-sm font-medium uppercase tracking-wide text-white transition hover:bg-accent"
        >
          Finalizar compra
        </Link>
      </div>
    </div>
  );
}
