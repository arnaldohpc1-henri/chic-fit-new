"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Coupon } from "@/lib/coupon-types";

function formatDiscount(c: Coupon): string {
  return c.type === "percentual"
    ? `${c.value}%`
    : c.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

function formatValidade(c: Coupon): string {
  if (!c.startDate && !c.endDate) return "Sem validade";
  if (c.startDate && c.endDate) return `${formatDate(c.startDate)} – ${formatDate(c.endDate)}`;
  if (c.endDate) return `até ${formatDate(c.endDate)}`;
  return `a partir de ${formatDate(c.startDate!)}`;
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then(setCoupons)
      .catch(() => setError("Erro ao carregar cupons."));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(c: Coupon) {
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, active: !c.active }),
      });
      if (!res.ok) throw new Error();
      setCoupons((prev) => (prev ? prev.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)) : prev));
    } catch {
      setError("Não foi possível atualizar o status agora. Tente novamente.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este cupom? Prefira desativá-lo para manter o histórico de uso.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCoupons((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
    } catch {
      setError("Não foi possível excluir. Tente novamente.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">🎟️ Cupons</h1>
        <Link
          href="/admin/cupons/novo"
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-white hover:bg-accent"
        >
          + Novo cupom
        </Link>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {!coupons ? (
        <p className="text-muted">Carregando...</p>
      ) : coupons.length === 0 ? (
        <p className="text-muted">Nenhum cupom cadastrado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Desconto</th>
                <th className="px-4 py-3 font-medium">Validade</th>
                <th className="px-4 py-3 font-medium">Utilizações</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{c.code}</td>
                  <td className="px-4 py-3">{formatDiscount(c)}</td>
                  <td className="px-4 py-3 text-muted">{formatValidade(c)}</td>
                  <td className="px-4 py-3 text-muted">
                    {c.usageCount} / {c.usageLimit ?? "∞"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${c.active ? "bg-emerald-500" : "bg-border"}`}
                      />
                      {c.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/cupons/${c.id}`}
                        className="text-accent hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => toggleActive(c)}
                        disabled={busyId === c.id}
                        className="text-muted hover:text-accent disabled:opacity-50"
                      >
                        {c.active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={busyId === c.id}
                        className="text-muted hover:text-red-600 disabled:opacity-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
