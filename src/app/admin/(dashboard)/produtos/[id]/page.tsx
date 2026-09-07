"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditarProdutoPage() {
  const params = useParams<{ id: string }>();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Editar peça</h1>
      <ProductForm mode="edit" productId={params.id} />
    </div>
  );
}
