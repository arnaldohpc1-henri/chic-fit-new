import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, products } from "@/lib/products";
import { ProductView } from "@/components/ProductView";
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

      <ProductView product={product} />

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
