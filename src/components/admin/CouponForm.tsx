"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon, DiscountType } from "@/lib/coupon-types";

type Props =
  | { mode: "create"; couponId?: undefined }
  | { mode: "edit"; couponId: string };

type FormState = {
  code: string;
  type: DiscountType;
  valueText: string;
  active: boolean;
  startDate: string;
  endDate: string;
  minPurchaseText: string;
  usageLimitText: string;
  firstPurchaseOnly: boolean;
};

const EMPTY_FORM: FormState = {
  code: "",
  type: "percentual",
  valueText: "",
  active: true,
  startDate: "",
  endDate: "",
  minPurchaseText: "",
  usageLimitText: "",
  firstPurchaseOnly: false,
};

function couponToForm(c: Coupon): FormState {
  return {
    code: c.code,
    type: c.type,
    valueText: String(c.value),
    active: c.active,
    startDate: c.startDate ?? "",
    endDate: c.endDate ?? "",
    minPurchaseText: c.minPurchase > 0 ? String(c.minPurchase) : "",
    usageLimitText: c.usageLimit !== null ? String(c.usageLimit) : "",
    firstPurchaseOnly: c.firstPurchaseOnly,
  };
}

export function CouponForm(props: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(props.mode === "edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (props.mode !== "edit") return;
    fetch(`/api/admin/coupons/${props.couponId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Cupom não encontrado.");
        return r.json();
      })
      .then((data: Coupon) => setForm(couponToForm(data)))
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const value = Number(form.valueText.replace(",", "."));
    if (!form.code.trim()) {
      setError("Informe o código do cupom.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("Informe um valor de desconto válido.");
      setSaving(false);
      return;
    }
    if (form.type === "percentual" && value > 100) {
      setError("O desconto percentual não pode passar de 100%.");
      setSaving(false);
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("A data final não pode ser antes da data inicial.");
      setSaving(false);
      return;
    }

    const minPurchase = form.minPurchaseText.trim() === "" ? 0 : Number(form.minPurchaseText.replace(",", "."));
    const usageLimit = form.usageLimitText.trim() === "" ? null : Number(form.usageLimitText);

    const payload = {
      code: form.code.trim(),
      type: form.type,
      value,
      active: form.active,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      minPurchase: Number.isFinite(minPurchase) && minPurchase > 0 ? minPurchase : 0,
      usageLimit: usageLimit !== null && Number.isFinite(usageLimit) && usageLimit > 0 ? Math.floor(usageLimit) : null,
      firstPurchaseOnly: form.firstPurchaseOnly,
    };

    try {
      const url = props.mode === "edit" ? `/api/admin/coupons/${props.couponId}` : "/api/admin/coupons";
      const res = await fetch(url, {
        method: props.mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Não foi possível salvar.");
      }
      await new Promise((r) => setTimeout(r, 500));
      router.push("/admin/cupons");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (props.mode !== "edit") return;
    if (!confirm("Tem certeza que quer excluir este cupom? Prefira desativá-lo para manter o histórico.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${props.couponId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Não foi possível excluir.");
      await new Promise((r) => setTimeout(r, 500));
      router.push("/admin/cupons");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-muted">Carregando...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Código do cupom *
          </label>
          <input
            required
            value={form.code}
            placeholder="Ex: BLACK10"
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 uppercase outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Tipo de desconto *
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DiscountType }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
          >
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Valor fixo (R$)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            {form.type === "percentual" ? "Desconto (%) *" : "Desconto (R$) *"}
          </label>
          <input
            type="number"
            min="0"
            step={form.type === "percentual" ? "1" : "0.01"}
            required
            value={form.valueText}
            onChange={(e) => setForm((f) => ({ ...f, valueText: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Valor mínimo da compra (R$)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00 = sem mínimo"
            value={form.minPurchaseText}
            onChange={(e) => setForm((f) => ({ ...f, minPurchaseText: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Data inicial
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Data final
          </label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Limite de utilização
        </label>
        <input
          type="number"
          min="1"
          placeholder="Em branco = ilimitado"
          value={form.usageLimitText}
          onChange={(e) => setForm((f) => ({ ...f, usageLimitText: e.target.value }))}
          className="w-full max-w-xs rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Cupom ativo (aceito no site)
        </label>

        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.firstPurchaseOnly}
            onChange={(e) => setForm((f) => ({ ...f, firstPurchaseOnly: e.target.checked }))}
            className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
          />
          <span>
            Somente primeira compra
            <span className="mt-0.5 block text-xs text-muted">
              O site ainda não identifica clientes de forma confiável (não há login/conta), então
              marcar esta opção bloqueia o cupom para todo mundo, com uma mensagem explicando o
              motivo — em vez de fingir validar algo que não é possível confirmar hoje.
            </span>
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between border-t border-border pt-6">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-foreground px-8 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-accent disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/cupons")}
            className="rounded-full border border-border px-8 py-3 text-sm font-medium uppercase tracking-wide hover:border-accent"
          >
            Cancelar
          </button>
        </div>

        {props.mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-muted hover:text-red-600 disabled:opacity-60"
          >
            {deleting ? "Excluindo..." : "Excluir cupom"}
          </button>
        )}
      </div>
    </form>
  );
}
