import { NextRequest, NextResponse } from "next/server";
import { getCoupons, mutateCoupons, normalizeCoupon } from "@/lib/coupons";
import { normalizeCode } from "@/lib/coupon-rules";
import type { Coupon } from "@/lib/coupon-types";
import { blobErrorMessage } from "@/lib/blob-error";

export const dynamic = "force-dynamic";

class NotFoundError extends Error {}
class DuplicateError extends Error {}

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coupons = await getCoupons();
  const coupon = coupons.find((c) => c.id === id);
  if (!coupon) return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });
  return NextResponse.json(coupon);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const error = validateBody(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const code = normalizeCode(String((body as Partial<Coupon>).code));

  let updated!: Coupon;
  try {
    await mutateCoupons((current) => {
      const index = current.findIndex((c) => c.id === id);
      if (index === -1) throw new NotFoundError();

      const clashesWithAnother = current.some((c) => c.id !== id && c.code === code);
      if (clashesWithAnother) throw new DuplicateError(`Já existe um cupom com o código "${code}".`);

      updated = normalizeCoupon({
        ...current[index],
        ...(body as Partial<Coupon>),
        id: current[index].id,
        code,
      });

      const next = [...current];
      next[index] = updated;
      return next;
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });
    }
    if (err instanceof DuplicateError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: blobErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await mutateCoupons((current) => {
      if (!current.some((c) => c.id === id)) throw new NotFoundError();
      return current.filter((c) => c.id !== id);
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: blobErrorMessage(err) }, { status: 500 });
  }
}
