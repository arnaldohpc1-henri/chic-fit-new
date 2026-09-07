"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { Product, ColorVariant } from "@/lib/product-types";

type Props =
  | { mode: "create"; productId?: undefined }
  | { mode: "edit"; productId: string };

type FormState = {
  name: string;
  category: string;
  priceText: string;
  sizesText: string;
  description: string;
  detailsText: string;
  colors: ColorVariant[];
};

const EMPTY_FORM: FormState = {
  name: "",
  category: "",
  priceText: "",
  sizesText: "",
  description: "",
  detailsText: "",
  colors: [{ name: "", images: [] }],
};

function productToForm(p: Product): FormState {
  return {
    name: p.name,
    category: p.category,
    priceText: p.price === null ? "" : String(p.price),
    sizesText: p.sizes.join(", "),
    description: p.description,
    detailsText: p.details.join("\n"),
    colors: p.colors.length > 0 ? p.colors : [{ name: "", images: [] }],
  };
}

export function ProductForm(props: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(props.mode === "edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        setCategories(Array.from(new Set(data.map((p) => p.category))));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (props.mode !== "edit") return;
    fetch(`/api/admin/products/${props.productId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Peça não encontrada.");
        return r.json();
      })
      .then((data: Product) => setForm(productToForm(data)))
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode]);

  function updateColor(index: number, patch: Partial<ColorVariant>) {
    setForm((f) => ({
      ...f,
      colors: f.colors.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }

  function addColor() {
    setForm((f) => ({ ...f, colors: [...f.colors, { name: "", images: [] }] }));
  }

  function removeColor(index: number) {
    setForm((f) => ({ ...f, colors: f.colors.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const price = form.priceText.trim() === "" ? null : Number(form.priceText);
    if (price !== null && (Number.isNaN(price) || price < 0)) {
      setError("Preço inválido.");
      setSaving(false);
      return;
    }

    const validColors = form.colors
      .map((c) => ({ name: c.name.trim(), images: c.images }))
      .filter((c) => c.name.length > 0);

    if (!form.name.trim() || !form.category.trim() || validColors.length === 0) {
      setError("Preencha nome, categoria e ao menos uma cor.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price,
      isDraft: price === null,
      sizes: form.sizesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      description: form.description.trim(),
      details: form.detailsText
        .split("\n")
        .map((d) => d.trim())
        .filter(Boolean),
      colors: validColors,
    };

    try {
      const url =
        props.mode === "edit" ? `/api/admin/products/${props.productId}` : "/api/admin/products";
      const res = await fetch(url, {
        method: props.mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Não foi possível salvar.");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (props.mode !== "edit") return;
    if (!confirm("Tem certeza que quer excluir esta peça? Essa ação não pode ser desfeita.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${props.productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Não foi possível excluir.");
      router.push("/admin");
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Nome da peça *
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Categoria *
          </label>
          <input
            required
            list="categorias-existentes"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
          />
          <datalist id="categorias-existentes">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Preço (R$) — deixe em branco para &quot;Em breve&quot;
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.priceText}
            onChange={(e) => setForm((f) => ({ ...f, priceText: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Tamanhos (separados por vírgula)
          </label>
          <input
            value={form.sizesText}
            placeholder="P, M, G ou Único (veste do 36 ao 42)"
            onChange={(e) => setForm((f) => ({ ...f, sizesText: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Descrição
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Detalhes (um por linha)
        </label>
        <textarea
          rows={4}
          value={form.detailsText}
          placeholder={"Tecido de alta compressão\nToque macio"}
          onChange={(e) => setForm((f) => ({ ...f, detailsText: e.target.value }))}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted">Cores e fotos *</p>
          <button
            type="button"
            onClick={addColor}
            className="text-sm text-accent hover:underline"
          >
            + Adicionar cor
          </button>
        </div>

        <div className="space-y-4">
          {form.colors.map((color, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-3">
                <input
                  placeholder="Nome da cor (ex: Preto)"
                  value={color.name}
                  onChange={(e) => updateColor(i, { name: e.target.value })}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2 outline-none focus:border-accent"
                />
                {form.colors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColor(i)}
                    className="text-sm text-muted hover:text-red-600"
                  >
                    Remover cor
                  </button>
                )}
              </div>
              <ImageUploader
                images={color.images}
                onChange={(images) => updateColor(i, { images })}
              />
            </div>
          ))}
        </div>
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
            onClick={() => router.push("/admin")}
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
            {deleting ? "Excluindo..." : "Excluir peça"}
          </button>
        )}
      </div>
    </form>
  );
}
