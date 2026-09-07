import { NextRequest, NextResponse } from "next/server";
import { getProducts, saveProducts } from "@/lib/products";
import { blobErrorMessage } from "@/lib/blob-error";

export const dynamic = "force-dynamic";

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
    body.colors.length === 0
  ) {
    return NextResponse.json(
      { error: "Preencha nome, categoria e ao menos uma cor com foto." },
      { status: 400 }
    );
  }

  const products = await getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Peça não encontrada." }, { status: 404 });
  }

  const updated = {
    ...products[index],
    name: String(body.name),
    category: String(body.category),
    price: body.price === null || body.price === undefined ? null : Number(body.price),
    isDraft: Boolean(body.isDraft),
    sizes: Array.isArray(body.sizes) ? body.sizes : [],
    description: body.description ? String(body.description) : "",
    details: Array.isArray(body.details) ? body.details : [],
    colors: body.colors,
  };

  products[index] = updated;
  try {
    await saveProducts(products);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: blobErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const products = await getProducts();
  const filtered = products.filter((p) => p.id !== id);

  if (filtered.length === products.length) {
    return NextResponse.json({ error: "Peça não encontrada." }, { status: 404 });
  }

  try {
    await saveProducts(filtered);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: blobErrorMessage(err) }, { status: 500 });
  }
}
