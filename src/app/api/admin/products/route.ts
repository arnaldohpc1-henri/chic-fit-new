import { NextRequest, NextResponse } from "next/server";
import { getProducts, mutateProducts, normalizeColor } from "@/lib/products";
import type { Product } from "@/lib/product-types";
import { blobErrorMessage } from "@/lib/blob-error";

export const dynamic = "force-dynamic";

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
    body.colors.length === 0 ||
    body.colors.some((c: { name?: unknown }) => !c?.name || !String(c.name).trim())
  ) {
    return NextResponse.json(
      { error: "Preencha nome, categoria e ao menos uma cor." },
      { status: 400 }
    );
  }

  let created!: Product;

  try {
    await mutateProducts((current) => {
      const baseSlug = slugify(`${body.name}-${body.colors[0]?.name ?? ""}`);
      const id = uniqueId(baseSlug, current.map((p) => p.id));

      created = {
        id,
        slug: id,
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

      return [...current, created];
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: blobErrorMessage(err) }, { status: 500 });
  }
}
