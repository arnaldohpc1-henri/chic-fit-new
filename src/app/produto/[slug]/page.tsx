import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, products } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartForm } from "@/components/AddToCartForm";
import { ProductCard } from "@/components/ProductCard";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = products.filter(
    (p) => p.category === product.category && p.id !== product.id
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="mb-6 text-xs uppercase tracking-wide text-muted">
        <Link href="/loja" className="hover:text-accent">
          Loja
        </Link>{" "}
        / <span>{product.category}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          alt={`${product.name} — ${product.color}`}
        />

        <div>
          <p className="text-xs uppercase tracking-wide text-muted">
            {product.category}
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-1 text-muted">Cor: {product.color}</p>
          <p className="mt-4 text-2xl font-medium">
            {formatPrice(product.price)}
          </p>

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
            <AddToCartForm product={product} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl">
            Combina com {product.category.toLowerCase()}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
