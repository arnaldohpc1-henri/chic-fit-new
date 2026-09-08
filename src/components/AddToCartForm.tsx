"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/product-types";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/config/site";

export function AddToCartForm({
  product,
  color,
  image,
}: {
  product: Product;
  color: string | null;
  image: string;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [rawSize, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0] : null
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const hasColors = product.colors.length > 0;
  const hasSizes = product.sizes.length > 0;
  const colorRequired = product.colors.length > 1;
  const sizeRequired = product.sizes.length > 1;
  const colorMissing = colorRequired && !color;

  // chave usada para casar com `variant.colorName`/`variant.size`: peças sem
  // cor/tamanho usam "" internamente (ver normalizeProduct/generateVariants)
  const colorKey = hasColors ? color : "";

  function variantFor(sz: string) {
    if (colorKey === null) return undefined;
    return product.variants.find(
      (v) => v.active && v.colorName === colorKey && v.size === sz
    );
  }

  // Se a cor mudou e o tamanho escolhido não existe (ou está sem estoque)
  // para a nova cor, trata como "nenhum tamanho selecionado" sem precisar
  // de um efeito — assim que o cliente clicar em outro, `size` é atualizado
  // normalmente.
  const rawSizeVariant = rawSize !== null ? variantFor(rawSize) : undefined;
  const rawSizeStillValid =
    rawSize === null ||
    product.sizes.length <= 1 ||
    colorKey === null ||
    (!!rawSizeVariant && rawSizeVariant.stock > 0);
  const size = rawSizeStillValid ? rawSize : null;

  const allOutOfStock =
    product.variants.length > 0 && product.variants.every((v) => !v.active || v.stock <= 0);

  if (product.isDraft || product.price === null) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted">
          Essa peça ainda não está disponível para compra pelo site. Fale com a
          gente para saber preço, tamanhos e disponibilidade.
        </p>
        <a
          href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
            `Olá! Tenho interesse na peça "${product.name}${color ? ` - ${color}` : ""}" que vi no site.`
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

  if (allOutOfStock) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-medium uppercase tracking-wide text-muted">
          Produto esgotado
        </p>
        <p className="mt-1 text-sm text-muted">
          Todas as combinações de cor e tamanho estão sem estoque no momento.
        </p>
      </div>
    );
  }

  const sizeMissing = sizeRequired && !size;
  const sizeKey = hasSizes ? size : "";
  const currentVariant = colorKey !== null && sizeKey !== null ? variantFor(sizeKey) : undefined;
  const comboOutOfStock =
    product.variants.length > 0 &&
    !colorMissing &&
    !sizeMissing &&
    colorKey !== null &&
    sizeKey !== null &&
    (!currentVariant || currentVariant.stock <= 0);

  const canAdd = !colorMissing && !sizeMissing && !comboOutOfStock;

  function handleAdd() {
    if (!canAdd || color === null) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        color,
        size: size ?? "",
        price: product.price as number,
        image,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-5">
      {hasSizes && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">
            Tamanho
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const v = variantFor(s);
              const disabled = colorKey !== null && (!v || v.stock <= 0);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSize(s)}
                  title={disabled ? "Esgotado nesta cor" : undefined}
                  className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border px-4 py-2 text-sm transition ${
                    size === s
                      ? "border-foreground bg-foreground text-white"
                      : disabled
                        ? "cursor-not-allowed border-border text-muted/50 line-through"
                        : "border-border hover:border-accent"
                  }`}
                >
                  {s}
                </button>
              );
            })}
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

      {colorMissing ? (
        <p className="text-sm text-accent">Selecione uma cor para continuar.</p>
      ) : sizeMissing ? (
        <p className="text-sm text-accent">Selecione um tamanho para continuar.</p>
      ) : (
        comboOutOfStock && (
          <p className="text-sm text-accent">
            Esgotado para esta combinação de cor e tamanho.
          </p>
        )
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="flex-1 rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? "Adicionado!" : "Adicionar ao carrinho"}
        </button>
        <button
          type="button"
          onClick={() => {
            handleAdd();
            router.push("/carrinho");
          }}
          disabled={!canAdd}
          className="flex-1 rounded-full border border-foreground px-6 py-3 text-sm font-medium uppercase tracking-wide transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Comprar agora
        </button>
      </div>
    </div>
  );
}
