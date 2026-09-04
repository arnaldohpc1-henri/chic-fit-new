import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group block overflow-hidden rounded-2xl bg-card"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-border">
        <Image
          src={product.images[0]}
          alt={`${product.name} — ${product.color}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.isDraft && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-3 py-1 text-[11px] uppercase tracking-wide text-white">
            Em breve
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted">
          {product.category}
        </p>
        <h3 className="mt-1 font-display text-lg leading-tight">
          {product.name}
        </h3>
        <p className="text-sm text-muted">{product.color}</p>
        <p className="mt-2 text-sm font-medium">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
