"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { formatPrice } from "@/lib/format";
import type { ColorOption, PriceBounds } from "@/lib/product-filters";

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

type PendingState = {
  categories: string[];
  sizes: string[];
  colors: string[];
  priceMin: number;
  priceMax: number;
};

type Props = {
  categories: string[];
  sizes: string[];
  colors: ColorOption[];
  priceBounds: PriceBounds;
};

/**
 * Todas as leituras/escritas de filtro passam pela URL (searchParams) — é a
 * única fonte de verdade, tanto para persistência/compartilhamento (regra 14)
 * quanto para não duplicar estado entre o sidebar do desktop e o painel do
 * celular.
 */
function useFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCategories = parseList(searchParams.get("categoria"));
  const selectedSizes = parseList(searchParams.get("tamanho"));
  const selectedColors = parseList(searchParams.get("cor"));
  const priceMinParam = searchParams.get("precoMin");
  const priceMaxParam = searchParams.get("precoMax");

  function navigate(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function apply(patch: Record<string, string | string[] | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      const isEmpty = value === null || value === "" || (Array.isArray(value) && value.length === 0);
      if (isEmpty) next.delete(key);
      else next.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    navigate(next);
  }

  function applyAll(state: PendingState, priceBounds: PriceBounds) {
    apply({
      categoria: state.categories,
      tamanho: state.sizes,
      cor: state.colors,
      precoMin: state.priceMin > priceBounds.min ? String(state.priceMin) : null,
      precoMax: state.priceMax < priceBounds.max ? String(state.priceMax) : null,
    });
  }

  function clearAll() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("categoria");
    next.delete("tamanho");
    next.delete("cor");
    next.delete("precoMin");
    next.delete("precoMax");
    navigate(next);
  }

  return {
    searchParams,
    selectedCategories,
    selectedSizes,
    selectedColors,
    priceMinParam,
    priceMaxParam,
    apply,
    applyAll,
    clearAll,
  };
}

function PriceRangeSlider({
  bounds,
  valueMin,
  valueMax,
  onCommit,
}: {
  bounds: PriceBounds;
  valueMin: number;
  valueMax: number;
  onCommit: (min: number, max: number) => void;
}) {
  const [localMin, setLocalMin] = useState(valueMin);
  const [localMax, setLocalMax] = useState(valueMax);
  const span = Math.max(1, bounds.max - bounds.min);

  if (bounds.max <= bounds.min) {
    return <p className="text-sm text-muted">{formatPrice(bounds.min)}</p>;
  }

  return (
    <div>
      <div className="price-range relative h-6">
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={localMin}
          onChange={(e) => setLocalMin(Math.min(Number(e.target.value), localMax))}
          onMouseUp={() => onCommit(localMin, localMax)}
          onTouchEnd={() => onCommit(localMin, localMax)}
          onKeyUp={() => onCommit(localMin, localMax)}
          aria-label="Preço mínimo"
          className="absolute inset-x-0 top-0 w-full"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={localMax}
          onChange={(e) => setLocalMax(Math.max(Number(e.target.value), localMin))}
          onMouseUp={() => onCommit(localMin, localMax)}
          onTouchEnd={() => onCommit(localMin, localMax)}
          onKeyUp={() => onCommit(localMin, localMax)}
          aria-label="Preço máximo"
          className="absolute inset-x-0 top-0 w-full"
        />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border">
          <div
            className="absolute h-1 rounded-full bg-accent"
            style={{
              left: `${((localMin - bounds.min) / span) * 100}%`,
              right: `${100 - ((localMax - bounds.min) / span) * 100}%`,
            }}
          />
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted">
        <span>{formatPrice(localMin)}</span>
        <span>{formatPrice(localMax)}</span>
      </div>
    </div>
  );
}

function FilterGroups({
  categories,
  sizes,
  colors,
  priceBounds,
  selectedCategories,
  selectedSizes,
  selectedColors,
  priceMin,
  priceMax,
  onToggleCategory,
  onToggleSize,
  onToggleColor,
  onPriceCommit,
}: {
  categories: string[];
  sizes: string[];
  colors: ColorOption[];
  priceBounds: PriceBounds;
  selectedCategories: string[];
  selectedSizes: string[];
  selectedColors: string[];
  priceMin: number;
  priceMax: number;
  onToggleCategory: (c: string) => void;
  onToggleSize: (s: string) => void;
  onToggleColor: (c: string) => void;
  onPriceCommit: (min: number, max: number) => void;
}) {
  return (
    <div className="space-y-6">
      {categories.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">Categoria</p>
          <div className="space-y-1.5">
            {categories.map((cat) => (
              <label
                key={cat}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground/85 hover:text-accent"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => onToggleCategory(cat)}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                {cat}
              </label>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">Tamanho</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const active = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onToggleSize(size)}
                  aria-pressed={active}
                  className={`flex min-h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm transition ${
                    active
                      ? "border-foreground bg-foreground text-white"
                      : "border-border hover:border-accent"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">Cor</p>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((c) => {
              const active = selectedColors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  aria-label={`Filtrar por cor ${c.name}`}
                  aria-pressed={active}
                  onClick={() => onToggleColor(c.name)}
                  style={{ backgroundColor: c.hex }}
                  className={`h-7 w-7 rounded-full border transition ${
                    active
                      ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
                      : "border-border/60"
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {priceBounds.max > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">Preço</p>
          <PriceRangeSlider bounds={priceBounds} valueMin={priceMin} valueMax={priceMax} onCommit={onPriceCommit} />
        </div>
      )}
    </div>
  );
}

export function ShopFilters({ categories, sizes, colors, priceBounds }: Props) {
  const {
    selectedCategories,
    selectedSizes,
    selectedColors,
    priceMinParam,
    priceMaxParam,
    apply,
    applyAll,
    clearAll,
  } = useFilterState();
  const [mobileOpen, setMobileOpen] = useState(false);

  const priceMin = priceMinParam ? Number(priceMinParam) : priceBounds.min;
  const priceMax = priceMaxParam ? Number(priceMaxParam) : priceBounds.max;

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    priceMinParam !== null ||
    priceMaxParam !== null;

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Filtros</p>
            {hasActiveFilters && (
              <button type="button" onClick={clearAll} className="text-xs text-muted hover:text-accent">
                Limpar
              </button>
            )}
          </div>
          <FilterGroups
            categories={categories}
            sizes={sizes}
            colors={colors}
            priceBounds={priceBounds}
            selectedCategories={selectedCategories}
            selectedSizes={selectedSizes}
            selectedColors={selectedColors}
            priceMin={priceMin}
            priceMax={priceMax}
            onToggleCategory={(c) => apply({ categoria: toggleValue(selectedCategories, c) })}
            onToggleSize={(s) => apply({ tamanho: toggleValue(selectedSizes, s) })}
            onToggleColor={(c) => apply({ cor: toggleValue(selectedColors, c) })}
            onPriceCommit={(min, max) =>
              apply({
                precoMin: min > priceBounds.min ? String(min) : null,
                precoMax: max < priceBounds.max ? String(max) : null,
              })
            }
          />
        </div>
      </aside>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm uppercase tracking-wide hover:border-accent lg:hidden"
      >
        Filtrar
        {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      </button>

      {mobileOpen && (
        <MobileDrawer
          categories={categories}
          sizes={sizes}
          colors={colors}
          priceBounds={priceBounds}
          initial={{
            categories: selectedCategories,
            sizes: selectedSizes,
            colors: selectedColors,
            priceMin,
            priceMax,
          }}
          onApply={(state) => {
            applyAll(state, priceBounds);
            setMobileOpen(false);
          }}
          onClear={() => {
            clearAll();
            setMobileOpen(false);
          }}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

function MobileDrawer({
  categories,
  sizes,
  colors,
  priceBounds,
  initial,
  onApply,
  onClear,
  onClose,
}: {
  categories: string[];
  sizes: string[];
  colors: ColorOption[];
  priceBounds: PriceBounds;
  initial: PendingState;
  onApply: (state: PendingState) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<PendingState>(initial);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      <button
        type="button"
        aria-label="Fechar filtros"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />
      <div className="relative max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Filtrar produtos</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted hover:text-accent">
            ✕
          </button>
        </div>

        <FilterGroups
          categories={categories}
          sizes={sizes}
          colors={colors}
          priceBounds={priceBounds}
          selectedCategories={pending.categories}
          selectedSizes={pending.sizes}
          selectedColors={pending.colors}
          priceMin={pending.priceMin}
          priceMax={pending.priceMax}
          onToggleCategory={(c) =>
            setPending((p) => ({ ...p, categories: toggleValue(p.categories, c) }))
          }
          onToggleSize={(s) => setPending((p) => ({ ...p, sizes: toggleValue(p.sizes, s) }))}
          onToggleColor={(c) => setPending((p) => ({ ...p, colors: toggleValue(p.colors, c) }))}
          onPriceCommit={(min, max) => setPending((p) => ({ ...p, priceMin: min, priceMax: max }))}
        />

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setPending({
                categories: [],
                sizes: [],
                colors: [],
                priceMin: priceBounds.min,
                priceMax: priceBounds.max,
              });
              onClear();
            }}
            className="flex-1 rounded-full border border-border px-6 py-3 text-sm font-medium uppercase tracking-wide hover:border-accent"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => onApply(pending)}
            className="flex-1 rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-accent"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ActiveFilterChips({ colors }: { colors: ColorOption[] }) {
  const { selectedCategories, selectedSizes, selectedColors, priceMinParam, priceMaxParam, apply, clearAll } =
    useFilterState();

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    priceMinParam !== null ||
    priceMaxParam !== null;

  if (!hasActiveFilters) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {selectedCategories.map((c) => (
        <Chip key={`cat-${c}`} onRemove={() => apply({ categoria: toggleValue(selectedCategories, c) })}>
          {c}
        </Chip>
      ))}
      {selectedSizes.map((s) => (
        <Chip key={`size-${s}`} onRemove={() => apply({ tamanho: toggleValue(selectedSizes, s) })}>
          {s}
        </Chip>
      ))}
      {selectedColors.map((name) => {
        const hex = colors.find((c) => c.name === name)?.hex ?? "#CCCCCC";
        return (
          <Chip key={`color-${name}`} onRemove={() => apply({ cor: toggleValue(selectedColors, name) })}>
            <span
              title={name}
              className="inline-block h-3.5 w-3.5 rounded-full border border-border/60"
              style={{ backgroundColor: hex }}
            />
          </Chip>
        );
      })}
      {(priceMinParam !== null || priceMaxParam !== null) && (
        <Chip onRemove={() => apply({ precoMin: null, precoMax: null })}>
          {formatPrice(priceMinParam ? Number(priceMinParam) : 0)} –{" "}
          {priceMaxParam ? formatPrice(Number(priceMaxParam)) : "máx."}
        </Chip>
      )}
      <button type="button" onClick={clearAll} className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline">
        Limpar filtros
      </button>
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/85 transition hover:border-accent"
    >
      {children}
      <span aria-hidden>×</span>
    </button>
  );
}

const SORT_LABELS: Record<string, string> = {
  "": "Padrão",
  recentes: "Mais recentes",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
};

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("ordenar") ?? "";

  function handleChange(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set("ordenar", value);
    else next.delete("ordenar");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Ordenar por"
      className="min-h-11 flex-1 cursor-pointer rounded-full border border-border bg-background px-5 text-sm uppercase tracking-wide outline-none hover:border-accent focus:border-accent lg:flex-none"
    >
      {Object.entries(SORT_LABELS).map(([value, label]) => (
        <option key={value || "padrao"} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
