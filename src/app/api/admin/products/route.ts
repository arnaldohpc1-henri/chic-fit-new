import { NextRequest, NextResponse } from "next/server";
import { getProducts, saveProducts } from "@/lib/products";
import type { Product } from "@/lib/product-types";
import { blobErrorMessage } from "@/lib/blob-error";

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return base || "peca";
}

function uniqueId(base: string, existingIds: string[]): string {
  if (!existingIds.includes(base)) return base;
  let i = 2;
  while (existingIds.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
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
  const baseSlug = slugify(`${body.name}-${body.colors[0]?.name ?? ""}`);
  const id = uniqueId(baseSlug, products.map((p) => p.id));

  const newProduct: Product = {
    id,
    slug: id,
    name: String(body.name),
    category: String(body.category),
    price: body.price === null || body.price === undefined ? null : Number(body.price),
    isDraft: Boolean(body.isDraft),
    sizes: Array.isArray(body.sizes) ? body.sizes : [],
    description: body.description ? String(body.description) : "",
    details: Array.isArray(body.details) ? body.details : [],
    colors: body.colors,
  };

  try {
    await saveProducts([...products, newProduct]);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: blobErrorMessage(err) }, { status: 500 });
  }
}
