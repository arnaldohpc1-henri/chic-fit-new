import { NextRequest, NextResponse } from "next/server";
import { getProducts, mutateProducts, normalizeColor } from "@/lib/products";
import { blobErrorMessage } from "@/lib/blob-error";
import type { Product } from "@/lib/product-types";

export const dynamic = "force-dynamic";

class NotFoundError extends Error {}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.id === id);
  if (!product) {
    return NextResponse.json({ error: "Peça não encontrada." }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (
    !body?.name ||
    !body?.category ||
    !Array.isArray(body?.colors) ||
    body.colors.length === 0 ||
    body.colors.some((c: { name?: unknown }) => !c?.name || !String(c.name).trim())
  ) {
    return NextResponse.json(
      { error: "Preencha nome, categoria e ao menos uma cor." },
      { status: 400 }
    );
  }

  let updated!: Product;

  try {
    await mutateProducts((current) => {
      const index = current.findIndex((p) => p.id === id);
      if (index === -1) throw new NotFoundError();

      updated = {
        ...current[index],
        name: String(body.name),
        category: String(body.category),
        price: body.price === null || body.price === undefined ? null : Number(body.price),
        isDraft: Boolean(body.isDraft),
        sizes: Array.isArray(body.sizes) ? body.sizes : [],
        description: body.description ? String(body.description) : "",
        details: Array.isArray(body.details) ? body.details : [],
        images: Array.isArray(body.images) ? body.images : [],
        colors: body.colors.map(normalizeColor),
      };

      const next = [...current];
      next[index] = updated;
      return next;
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Peça não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ error: blobErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await mutateProducts((current) => {
      if (!current.some((p) => p.id === id)) throw new NotFoundError();
      return current.filter((p) => p.id !== id);
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Peça não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ error: blobErrorMessage(err) }, { status: 500 });
  }
}
