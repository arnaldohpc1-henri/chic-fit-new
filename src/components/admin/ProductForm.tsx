"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { Product, ColorVariant } from "@/lib/product-types";

type Props =
  | { mode: "create"; productId?: undefined }
  | { mode: "edit"; productId: string };

type FormVariant = {
  colorName: string;
  size: string;
  stock: number;
};

type FormState = {
  name: string;
  category: string;
  priceText: string;
  sizesText: string;
  description: string;
  detailsText: string;
  images: string[];
  colors: ColorVariant[];
  variants: FormVariant[];
};

const DEFAULT_HEX = "#000000";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const EMPTY_FORM: FormState = {
  name: "",
  category: "",
  priceText: "",
  sizesText: "",
  description: "",
  detailsText: "",
  images: [],
  colors: [{ name: "", hex: DEFAULT_HEX, images: [] }],
  variants: [],
};

function productToForm(p: Product): FormState {
  return {
    name: p.name,
    category: p.category,
    priceText: p.price === null ? "" : String(p.price),
    sizesText: p.sizes.join(", "),
    description: p.description,
    detailsText: p.details.join("\n"),
    images: p.images ?? [],
    colors:
      p.colors.length > 0
        ? p.colors.map((c) => ({
            name: c.name,
            hex: HEX_RE.test(c.hex ?? "") ? c.hex : DEFAULT_HEX,
            images: c.images,
          }))
        : [{ name: "", hex: DEFAULT_HEX, images: [] }],
    variants: (p.variants ?? []).map((v) => ({
      colorName: v.colorName,
      size: v.size,
      stock: v.stock,
    })),
  };
}

function variantKey(colorName: string, size: string): string {
  return `${colorName}::${size}`;
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
    setForm((f) => ({
      ...f,
      colors: [...f.colors, { name: "", hex: DEFAULT_HEX, images: [] }],
    }));
  }

  function removeColor(index: number) {
    setForm((f) => ({ ...f, colors: f.colors.filter((_, i) => i !== index) }));
  }

  function moveColor(index: number, direction: -1 | 1) {
    setForm((f) => {
      const target = index + direction;
      if (target < 0 || target >= f.colors.length) return f;
      const colors = [...f.colors];
      [colors[index], colors[target]] = [colors[target], colors[index]];
      return { ...f, colors };
    });
  }

  function generateVariants() {
    setForm((f) => {
      const colorNames = f.colors.map((c) => c.name.trim()).filter(Boolean);
      const sizeList = f.sizesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const colorKeys = colorNames.length > 0 ? colorNames : [""];
      const sizeKeys = sizeList.length > 0 ? sizeList : [""];

      const existingStock = new Map(
        f.variants.map((v) => [variantKey(v.colorName, v.size), v.stock])
      );

      const variants: FormVariant[] = [];
      for (const colorName of colorKeys) {
        for (const size of sizeKeys) {
          variants.push({
            colorName,
            size,
            stock: existingStock.get(variantKey(colorName, size)) ?? 0,
          });
        }
      }

      return { ...f, variants };
    });
  }

  function updateVariantStock(index: number, stock: number) {
    const safeStock = Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, stock: safeStock } : v)),
    }));
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

    const namedColors = form.colors
      .map((c) => ({ ...c, name: c.name.trim() }))
      .filter((c) => c.name.length > 0);

    if (!form.name.trim() || !form.category.trim() || namedColors.length === 0) {
      setError("Preencha nome, categoria e ao menos uma cor.");
      setSaving(false);
      return;
    }

    const invalidColor = namedColors.find((c) => !HEX_RE.test(c.hex));
    if (invalidColor) {
      setError(
        `Código hex inválido para a cor "${invalidColor.name}". Use o formato #RRGGBB.`
      );
      setSaving(false);
      return;
    }

    const validColors = namedColors.map((c) => ({
      name: c.name,
      hex: c.hex.toUpperCase(),
      images: c.images,
    }));

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
      images: form.images,
      colors: validColors,
      variants: form.variants,
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
      // pequena espera: dá tempo do Blob propagar a gravação antes do
      // painel recarregar a lista, evitando que a peça salva "suma" por
      // um instante
      await new Promise((r) => setTimeout(r, 700));
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
      await new Promise((r) => setTimeout(r, 700));
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
        <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Fotos gerais da peça
        </label>
        <p className="mb-2 text-xs text-muted">
          Usadas na vitrine e na página do produto quando a cor selecionada não
          tiver foto própria.
        </p>
        <ImageUploader
          images={form.images}
          onChange={(images) => setForm((f) => ({ ...f, images }))}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Cores disponíveis *</p>
            <p className="mt-1 text-xs text-muted">
              A foto de cada cor é opcional — sem ela, a peça usa as fotos gerais acima.
            </p>
          </div>
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
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <input
                  placeholder="Nome da cor (ex: Preto)"
                  value={color.name}
                  onChange={(e) => updateColor(i, { name: e.target.value })}
                  className="min-w-[160px] flex-1 rounded-xl border border-border bg-background px-4 py-2 outline-none focus:border-accent"
                />

                <input
                  type="color"
                  value={HEX_RE.test(color.hex) ? color.hex : DEFAULT_HEX}
                  onChange={(e) => updateColor(i, { hex: e.target.value })}
                  aria-label={`Selecionar cor visual para ${color.name || "esta cor"}`}
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-0.5"
                />
                <input
                  placeholder="#RRGGBB"
                  value={color.hex}
                  onChange={(e) => updateColor(i, { hex: e.target.value })}
                  className="w-28 shrink-0 rounded-xl border border-border bg-background px-3 py-2 text-sm uppercase outline-none focus:border-accent"
                />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveColor(i, -1)}
                    disabled={i === 0}
                    aria-label="Mover cor para cima"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-accent hover:text-accent disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveColor(i, 1)}
                    disabled={i === form.colors.length - 1}
                    aria-label="Mover cor para baixo"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-accent hover:text-accent disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>

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
              <p className="mb-2 text-xs text-muted">Foto desta cor (opcional)</p>
              <ImageUploader
                images={color.images}
                onChange={(images) => updateColor(i, { images })}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">
              Variações (cor × tamanho)
            </p>
            <p className="mt-1 text-xs text-muted">
              Gere as combinações e informe o estoque de cada uma. Uma combinação
              com estoque 0 aparece esgotada na loja.
            </p>
          </div>
          <button
            type="button"
            onClick={generateVariants}
            className="shrink-0 text-sm text-accent hover:underline"
          >
            Gerar variações
          </button>
        </div>

        {form.variants.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Nenhuma variação gerada ainda. Cadastre as cores e os tamanhos acima e
            clique em &quot;Gerar variações&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Cor</th>
                  <th className="px-3 py-2 font-medium">Tamanho</th>
                  <th className="px-3 py-2 font-medium">Estoque</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {form.variants.map((v, i) => (
                  <tr
                    key={variantKey(v.colorName, v.size)}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2">{v.colorName || "—"}</td>
                    <td className="px-3 py-2">{v.size || "—"}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => updateVariantStock(i, Number(e.target.value))}
                        className="w-20 rounded-lg border border-border bg-background px-2 py-1 outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {v.stock > 0 ? (
                        <span className="text-muted">Disponível</span>
                      ) : (
                        <span className="text-red-600">Esgotado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
