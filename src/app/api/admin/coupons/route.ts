import { NextRequest, NextResponse } from "next/server";
import { getCoupons, mutateCoupons, normalizeCoupon } from "@/lib/coupons";
import { normalizeCode } from "@/lib/coupon-rules";
import type { Coupon } from "@/lib/coupon-types";
import { blobErrorMessage } from "@/lib/blob-error";

export const dynamic = "force-dynamic";

function validateBody(body: unknown): string | null {
  const b = body as Partial<Coupon> | null;
  if (!b?.code || !String(b.code).trim()) return "Informe o código do cupom.";
  if (b.type !== "percentual" && b.type !== "fixo") return "Selecione o tipo de desconto.";
  if (typeof b.value !== "number" || !Number.isFinite(b.value) || b.value <= 0) {
    return "Informe um valor de desconto válido.";
  }
  if (b.type === "percentual" && b.value > 100) return "O desconto percentual não pode passar de 100%.";
  return null;
}

export async function GET() {
  const coupons = await getCoupons();
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const error = validateBody(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const code = normalizeCode(String((body as Partial<Coupon>).code));

  let created!: Coupon;
  try {
    await mutateCoupons((current) => {
      if (current.some((c) => c.code === code)) {
        throw new Error(`Já existe um cupom com o código "${code}".`);
      }

      created = normalizeCoupon({
        ...(body as Partial<Coupon>),
        id: code,
        code,
        usageCount: 0,
        createdAt: new Date().toISOString(),
      });

      return [...current, created];
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Já existe um cupom")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: blobErrorMessage(err) }, { status: 500 });
  }
}
