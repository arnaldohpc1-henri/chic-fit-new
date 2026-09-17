import { NextRequest, NextResponse } from "next/server";
import { getCouponByCode } from "@/lib/coupons";
import { evaluateCoupon, normalizeCode } from "@/lib/coupon-rules";

export const dynamic = "force-dynamic";

/**
 * Endpoint público (fora de /api/admin, não passa pelo login do painel):
 * recebe só o código e o subtotal, nunca o desconto — o valor é sempre
 * calculado aqui, nunca aceito do navegador (ver regra de segurança da
 * Prioridade 15). Reaproveitado tanto pela pré-visualização no carrinho
 * quanto, indiretamente, pela validação ao criar o pedido.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const subtotal = typeof body?.subtotal === "number" && Number.isFinite(body.subtotal) ? body.subtotal : NaN;

  if (!code.trim()) {
    return NextResponse.json({ valid: false, message: "Informe um código de cupom." }, { status: 400 });
  }
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return NextResponse.json(
      { valid: false, message: "Cupom disponível apenas para compras." },
      { status: 400 }
    );
  }

  const coupon = await getCouponByCode(code);
  const result = evaluateCoupon(coupon, subtotal);

  if (!result.ok) {
    return NextResponse.json({ valid: false, message: result.message });
  }

  return NextResponse.json({
    valid: true,
    code: normalizeCode(code),
    type: coupon!.type,
    value: coupon!.value,
    discountAmount: result.discountAmount,
    total: result.total,
  });
}
