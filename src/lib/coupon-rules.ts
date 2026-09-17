import type { Coupon } from "./coupon-types";

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Evita erros de ponto flutuante (ex: 19.990000000000002) — sempre 2 casas decimais. */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function startOfDay(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00.000Z`).getTime();
}

function endOfDay(dateStr: string): number {
  return new Date(`${dateStr}T23:59:59.999Z`).getTime();
}

export type CouponEvaluation =
  | { ok: true; discountAmount: number; total: number }
  | { ok: false; message: string };

/**
 * Única porta de entrada para validar e calcular um cupom — usada tanto pela
 * pré-visualização no carrinho (API pública) quanto pela criação do pedido
 * (API que grava o pedido), para nunca haver duas fontes de verdade sobre
 * quanto de desconto um cupom concede.
 */
export function evaluateCoupon(
  coupon: Coupon | undefined,
  subtotal: number,
  now: Date = new Date()
): CouponEvaluation {
  if (!coupon) {
    return { ok: false, message: "Esse cupom não existe ou é inválido." };
  }
  if (!coupon.active) {
    return { ok: false, message: "Esse cupom não está disponível." };
  }

  const nowMs = now.getTime();
  if (coupon.startDate && nowMs < startOfDay(coupon.startDate)) {
    return { ok: false, message: "Esse cupom ainda não está disponível." };
  }
  if (coupon.endDate && nowMs > endOfDay(coupon.endDate)) {
    return { ok: false, message: "Esse cupom expirou." };
  }

  if (coupon.firstPurchaseOnly) {
    return {
      ok: false,
      message:
        "Este cupom é exclusivo para a primeira compra. Essa verificação ainda não está disponível no site.",
    };
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, message: "Esse cupom atingiu o limite de utilizações." };
  }

  if (coupon.minPurchase > 0 && subtotal < coupon.minPurchase) {
    return {
      ok: false,
      message: `Este cupom exige uma compra mínima de ${formatBRL(coupon.minPurchase)}.`,
    };
  }

  let discount = coupon.type === "percentual" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  // nunca deixa o desconto passar do próprio subtotal (total nunca negativo)
  discount = Math.min(discount, subtotal);
  discount = roundCurrency(Math.max(0, discount));

  return { ok: true, discountAmount: discount, total: roundCurrency(subtotal - discount) };
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
