"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

type FormState = {
  name: string;
  email: string;
  phone: string;
  zip: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  zip: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  notes: "",
};

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            color: i.color,
            size: i.size,
            price: i.price,
            qty: i.qty,
          })),
          subtotal,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Não foi possível enviar o pedido.");
      }

      const order = await res.json();
      try {
        window.sessionStorage.setItem(
          `chicfit:order:${order.id}`,
          JSON.stringify(order)
        );
      } catch {
        // sessionStorage indisponível — a página de confirmação mostra um aviso
      }
      clear();
      router.push(`/pedido/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl">Seu carrinho está vazio</h1>
        <Link
          href="/loja"
          className="mt-8 inline-block rounded-full bg-foreground px-8 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-accent"
        >
          Ir para a loja
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="mb-8 font-display text-3xl">Finalizar compra</h1>

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="space-y-4">
            <legend className="mb-1 text-xs uppercase tracking-wide text-muted">
              Seus dados
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nome completo"
                required
                value={form.name}
                onChange={(v) => update("name", v)}
              />
              <Input
                label="E-mail"
                type="email"
                required
                value={form.email}
                onChange={(v) => update("email", v)}
              />
            </div>
            <Input
              label="WhatsApp / telefone"
              required
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="(99) 99999-9999"
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-1 text-xs uppercase tracking-wide text-muted">
              Endereço de entrega
            </legend>
            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <Input
                label="CEP"
                required
                value={form.zip}
                onChange={(v) => update("zip", v)}
              />
              <Input
                label="Endereço"
                required
                value={form.address}
                onChange={(v) => update("address", v)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <Input
                label="Número"
                required
                value={form.number}
                onChange={(v) => update("number", v)}
              />
              <Input
                label="Complemento"
                value={form.complement}
                onChange={(v) => update("complement", v)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Bairro"
                required
                value={form.neighborhood}
                onChange={(v) => update("neighborhood", v)}
              />
              <Input
                label="Cidade"
                required
                value={form.city}
                onChange={(v) => update("city", v)}
              />
              <Input
                label="Estado"
                required
                value={form.state}
                onChange={(v) => update("state", v)}
                placeholder="UF"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
                Observações (opcional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
              />
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-border bg-card p-4">
            <legend className="px-1 text-xs uppercase tracking-wide text-muted">
              Pagamento
            </legend>
            <p className="text-sm text-muted">
              O pagamento por cartão/Pix online ainda está sendo configurado.
              Ao confirmar, seu pedido é registrado e você finaliza o
              pagamento diretamente com a loja pelo WhatsApp.
            </p>
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-accent disabled:opacity-60"
          >
            {submitting ? "Enviando..." : "Confirmar pedido"}
          </button>
        </form>

        <div className="h-fit rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-xl">Resumo do pedido</h2>
          <ul className="space-y-3 text-sm">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.color}-${item.size}`}
                className="flex justify-between gap-3"
              >
                <span className="text-muted">
                  {item.qty}x {item.name} ({item.color}
                  {item.size ? `, ${item.size}` : ""})
                </span>
                <span>{formatPrice(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-medium">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Frete combinado diretamente com a loja.
          </p>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-accent"
      />
    </div>
  );
}
