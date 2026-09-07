import { ProductCard } from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/products";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Loja — Chic & Fit",
};

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string }>;
}) {
  const { categoria, busca } = await searchParams;
  const products = await getProducts();
  const categories = await getCategories();

  let filtered = categoria
    ? products.filter((p) => p.category === categoria)
    : products;

  if (busca) {
    const term = busca.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.colors.some((c) => c.name.toLowerCase().includes(term))
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">
          Todas as peças
        </p>
        <h1 className="mt-2 font-display text-4xl">Loja</h1>
        {busca && (
          <p className="mt-2 text-sm text-muted">
            Resultados para &quot;{busca}&quot;
          </p>
        )}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/loja"
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            !categoria
              ? "border-foreground bg-foreground text-white"
              : "border-border text-muted hover:border-accent hover:text-accent"
          }`}
        >
          Todas
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/loja?categoria=${encodeURIComponent(cat)}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              categoria === cat
                ? "border-foreground bg-foreground text-white"
                : "border-border text-muted hover:border-accent hover:text-accent"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">Nenhuma peça encontrada.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
