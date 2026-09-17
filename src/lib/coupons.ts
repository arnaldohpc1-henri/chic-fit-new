import { put, head, BlobPreconditionFailedError } from "@vercel/blob";
import type { Coupon } from "./coupon-types";
import { normalizeCode } from "./coupon-rules";

export type { Coupon } from "./coupon-types";

const CATALOG_PATH = "data/coupons.json";

export function normalizeCoupon(coupon: Partial<Coupon> & { code: string }): Coupon {
  return {
    id: typeof coupon.id === "string" && coupon.id ? coupon.id : normalizeCode(coupon.code),
    code: normalizeCode(coupon.code),
    type: coupon.type === "fixo" ? "fixo" : "percentual",
    value: typeof coupon.value === "number" && Number.isFinite(coupon.value) ? coupon.value : 0,
    active: coupon.active !== false,
    startDate: coupon.startDate ?? null,
    endDate: coupon.endDate ?? null,
    minPurchase:
      typeof coupon.minPurchase === "number" && Number.isFinite(coupon.minPurchase) && coupon.minPurchase > 0
        ? coupon.minPurchase
        : 0,
    usageLimit:
      typeof coupon.usageLimit === "number" && Number.isFinite(coupon.usageLimit) && coupon.usageLimit > 0
        ? Math.floor(coupon.usageLimit)
        : null,
    usageCount:
      typeof coupon.usageCount === "number" && Number.isFinite(coupon.usageCount) && coupon.usageCount >= 0
        ? Math.floor(coupon.usageCount)
        : 0,
    firstPurchaseOnly: coupon.firstPurchaseOnly === true,
    maxDiscount:
      typeof coupon.maxDiscount === "number" && Number.isFinite(coupon.maxDiscount) && coupon.maxDiscount > 0
        ? coupon.maxDiscount
        : null,
    createdAt: coupon.createdAt,
  };
}

// O cupom divulgado hoje no carrossel da Home ("10% OFF na primeira compra")
// mostra o código CHIC10 na própria arte — é esse o código que a cliente vê
// e vai digitar, então é ele que fica cadastrado por padrão (ver
// HOME_CAROUSEL_SLIDES em src/app/(site)/page.tsx). Assim como
// SEED_PRODUCTS, só é usado até a primeira gravação feita pelo painel.
const SEED_COUPONS: Coupon[] = [
  {
    id: "chic10",
    code: "CHIC10",
    type: "percentual",
    value: 10,
    active: true,
    startDate: null,
    endDate: null,
    minPurchase: 0,
    usageLimit: null,
    usageCount: 0,
    firstPurchaseOnly: false,
    maxDiscount: null,
  },
];

async function fetchCatalogBody(url: string): Promise<Coupon[]> {
  const res = await fetch(`${url}?t=${Date.now()}-${Math.random()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Falha ao buscar cupons salvos (status ${res.status}).`);
  return (await res.json()) as Coupon[];
}

async function readCatalogForMutation(): Promise<{ coupons: Coupon[]; etag?: string }> {
  const info = await head(CATALOG_PATH);
  const coupons = await fetchCatalogBody(info.url);
  return { coupons, etag: info.etag };
}

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const info = await head(CATALOG_PATH);
    const coupons = await fetchCatalogBody(info.url);
    return coupons.map(normalizeCoupon);
  } catch {
    return SEED_COUPONS.map(normalizeCoupon);
  }
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const normalized = normalizeCode(code);
  const coupons = await getCoupons();
  return coupons.find((c) => c.code === normalized);
}

async function waitUntilReadable(expected: string): Promise<void> {
  for (let i = 0; i < 8; i++) {
    await new Promise((resolve) => setTimeout(resolve, 300 * (i + 1)));
    try {
      const info = await head(CATALOG_PATH);
      const res = await fetch(`${info.url}?t=${Date.now()}-${Math.random()}`, { cache: "no-store" });
      if (res.ok && (await res.text()) === expected) return;
    } catch {
      // ignora e tenta de novo
    }
  }
}

/**
 * Mesma trava otimista por ETag usada em mutateProducts — evita que duas
 * gravações concorrentes (ex: dois pedidos usando o mesmo cupom quase ao
 * mesmo tempo) percam uma alteração.
 */
export async function mutateCoupons(mutate: (current: Coupon[]) => Coupon[]): Promise<Coupon[]> {
  const MAX_ATTEMPTS = 10;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let current: Coupon[];
    let etag: string | undefined;

    try {
      ({ coupons: current, etag } = await readCatalogForMutation());
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      const backoff = 80 * attempt + Math.random() * 150;
      await new Promise((resolve) => setTimeout(resolve, backoff));
      continue;
    }

    const next = mutate(current);
    const serialized = JSON.stringify(next, null, 2);
    const strongEtag = etag?.replace(/^W\//, "");

    try {
      await put(CATALOG_PATH, serialized, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        ...(strongEtag ? { ifMatch: strongEtag } : {}),
      });
      await waitUntilReadable(serialized);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const isConflict =
        err instanceof BlobPreconditionFailedError ||
        message.includes("Precondition failed") ||
        message.includes("ETag mismatch");
      if (!isConflict || attempt === MAX_ATTEMPTS) throw err;
      const backoff = 80 * attempt + Math.random() * 150;
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  throw new Error("Não foi possível salvar após várias tentativas.");
}

/**
 * Incrementa o uso real de um cupom — chamado só depois que o pedido foi
 * criado com sucesso usando esse cupom (ver POST /api/pedidos). É a única
 * origem de incremento: nunca é somado manualmente em outro lugar.
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  const normalized = normalizeCode(code);
  await mutateCoupons((current) =>
    current.map((c) => (c.code === normalized ? { ...c, usageCount: c.usageCount + 1 } : c))
  );
}
