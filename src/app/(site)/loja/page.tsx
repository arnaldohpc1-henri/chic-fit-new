import { ProductCard } from "@/components/ProductCard";
import { ActiveFilterChips, FilterSidebar, MobileFilterButton, SortSelect } from "@/components/shop/ShopFilters";
import { getProducts } from "@/lib/products";
import {
  collectCategories,
  collectColors,
  collectPriceBounds,
  collectSizes,
  parseFilters,
  productMatchesFilters,
  sortProducts,
} from "@/lib/product-filters";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Loja — Chic & Fit",
};

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoria?: string;
    tamanho?: string;
    cor?: string;
    precoMin?: string;
    precoMax?: string;
    ordenar?: string;
    busca?: string;
  }>;
}) {
  const params = await searchParams;
  const products = await getProducts();
  const filters = parseFilters(params);

  const categories = collectCategories(products);
  const sizes = collectSizes(products);
  const colors = collectColors(products);
  const priceBounds = collectPriceBounds(products);

  const filtered = sortProducts(
    products.filter((p) => productMatchesFilters(p, filters)),
    filters.sort
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">
          Todas as peças
        </p>
        <h1 className="mt-2 font-display text-4xl">Loja</h1>
        {filters.search && (
          <p className="mt-2 text-sm text-muted">
            Resultados para &quot;{filters.search}&quot;
          </p>
        )}
      </div>

      <div className="mb-6 flex gap-3 lg:hidden">
        <MobileFilterButton categories={categories} sizes={sizes} colors={colors} priceBounds={priceBounds} />
        <SortSelect className="flex-1" />
      </div>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <FilterSidebar categories={categories} sizes={sizes} colors={colors} priceBounds={priceBounds} />

        <div>
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {filtered.length === 0
                ? "Nenhum produto encontrado"
                : `${filtered.length} produto${filtered.length === 1 ? "" : "s"} encontrado${
                    filtered.length === 1 ? "" : "s"
                  }`}
            </p>
            <SortSelect className="hidden lg:block" />
          </div>

          <ActiveFilterChips colors={colors} />

          {filtered.length === 0 ? (
            <p className="text-muted">Não encontramos produtos com esses filtros.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
