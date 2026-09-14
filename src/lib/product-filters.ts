import type { Product } from "./product-types";

export type SortOption = "recentes" | "menor-preco" | "maior-preco";

const SORT_OPTIONS: SortOption[] = ["recentes", "menor-preco", "maior-preco"];

export type RawFilterParams = {
  categoria?: string;
  tamanho?: string;
  cor?: string;
  precoMin?: string;
  precoMax?: string;
  ordenar?: string;
  busca?: string;
};

export type ParsedFilters = {
  categories: string[];
  sizes: string[];
  colors: string[];
  priceMin: number | null;
  priceMax: number | null;
  search: string;
  sort: SortOption | null;
};

function parseList(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parsePrice(value: string | undefined | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseFilters(params: RawFilterParams): ParsedFilters {
  return {
    categories: parseList(params.categoria),
    sizes: parseList(params.tamanho),
    colors: parseList(params.cor),
    priceMin: parsePrice(params.precoMin),
    priceMax: parsePrice(params.precoMax),
    search: (params.busca ?? "").trim(),
    sort: SORT_OPTIONS.includes(params.ordenar as SortOption) ? (params.ordenar as SortOption) : null,
  };
}

/**
 * Um produto só é considerado compatível com cor/tamanho se existir uma
 * VARIAÇÃO ativa e com estoque para a combinação — não basta ele "ter" a
 * cor ou "ter" o tamanho separadamente (ver regras de cor+tamanho+estoque).
 */
export function productMatchesFilters(product: Product, filters: ParsedFilters): boolean {
  if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
    return false;
  }

  if (filters.search) {
    const term = filters.search.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      product.colors.some((c) => c.name.toLowerCase().includes(term));
    if (!matchesSearch) return false;
  }

  if (filters.priceMin !== null && (product.price === null || product.price < filters.priceMin)) {
    return false;
  }
  if (filters.priceMax !== null && (product.price === null || product.price > filters.priceMax)) {
    return false;
  }

  if (filters.sizes.length > 0 || filters.colors.length > 0) {
    const hasValidVariant = product.variants.some((v) => {
      if (!v.active || v.stock <= 0) return false;
      if (filters.sizes.length > 0 && !filters.sizes.includes(v.size)) return false;
      if (filters.colors.length > 0 && !filters.colors.includes(v.colorName)) return false;
      return true;
    });
    if (!hasValidVariant) return false;
  }

  return true;
}

export function sortProducts(products: Product[], sort: SortOption | null): Product[] {
  if (sort === null) return products;
  if (sort === "recentes") {
    // Sem campo de data no catálogo — a ordem de inserção no array já
    // reflete quem foi cadastrado por último (ver mutateProducts).
    return [...products].reverse();
  }
  if (sort === "menor-preco") {
    return [...products].sort((a, b) => {
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return a.price - b.price;
    });
  }
  if (sort === "maior-preco") {
    return [...products].sort((a, b) => {
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return b.price - a.price;
    });
  }
  return products;
}

const SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XG", "XGG", "EG", "EGG"];

export function collectSizes(products: Product[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const p of products) {
    for (const s of p.sizes) {
      if (s && !seen.has(s)) {
        seen.add(s);
        ordered.push(s);
      }
    }
  }
  return ordered.sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export type ColorOption = { name: string; hex: string };

export function collectColors(products: Product[]): ColorOption[] {
  const map = new Map<string, string>();
  for (const p of products) {
    for (const c of p.colors) {
      if (c.name && !map.has(c.name)) map.set(c.name, c.hex);
    }
  }
  return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
}

export function collectCategories(products: Product[]): string[] {
  return Array.from(new Set(products.map((p) => p.category)));
}

export type PriceBounds = { min: number; max: number };

export function collectPriceBounds(products: Product[]): PriceBounds {
  const prices = products.map((p) => p.price).filter((p): p is number => p !== null);
  if (prices.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
