"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/product-types";
import { formatPrice } from "@/lib/format";

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setError("Erro ao carregar peças."));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta peça? Essa ação não pode ser desfeita.")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Peças cadastradas</h1>
        <Link
          href="/admin/produtos/novo"
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-white hover:bg-accent"
        >
          + Nova peça
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {!products ? (
        <p className="text-muted">Carregando...</p>
      ) : products.length === 0 ? (
        <p className="text-muted">Nenhuma peça cadastrada ainda.</p>
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-border">
                {p.colors[0]?.images[0] && (
                  <Image
                    src={p.colors[0].images[0]}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted">
                  {p.category} · {p.colors.map((c) => c.name).join(", ")}
                </p>
              </div>
              <p className="text-sm font-medium">{formatPrice(p.price)}</p>
              <div className="flex gap-3">
                <Link
                  href={`/admin/produtos/${p.id}`}
                  className="text-sm text-accent hover:underline"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-sm text-muted hover:text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
