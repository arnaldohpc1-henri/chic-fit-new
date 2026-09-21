"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { formatCep, normalizeCep } from "@/lib/cep";

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

type CepStatus = "idle" | "loading" | "found" | "not_found" | "error";

export default function CheckoutPage() {
  const { items, subtotal, coupon, total, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");

  // CEP (dígitos) que os campos de cidade/UF atuais realmente refletem —
  // null enquanto não há uma consulta bem-sucedida vigente.
  const resolvedCepRef = useRef<string | null>(null);
  // CEP (dígitos) mais recente digitado, lido de forma síncrona dentro do
  // callback assíncrono da consulta para saber se o usuário já mudou o CEP
  // de novo enquanto a resposta ainda não tinha chegado.
  const latestCepDigitsRef = useRef("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const runCepLookup = useCallback((digits: string) => {
    setCepStatus("loading");
    fetch(`/api/cep/${digits}`)
      .then((r) => r.json())
      .then((data) => {
        if (latestCepDigitsRef.current !== digits) return; // CEP já mudou de novo
        if (data.found) {
          resolvedCepRef.current = digits;
          setForm((f) => ({
            ...f,
            address: data.street || f.address,
            neighborhood: data.neighborhood || f.neighborhood,
            city: data.city,
            state: data.state,
          }));
          setCepStatus("found");
        } else if (data.reason === "not_found") {
          setCepStatus("not_found");
        } else {
          setCepStatus("error");
        }
      })
      .catch(() => {
        if (latestCepDigitsRef.current === digits) setCepStatus("error");
      });
  }, []);

  // Dispara a consulta automaticamente quando o CEP chega a 8 dígitos, e
  // invalida imediatamente cidade/UF/endereço/bairro assim que o CEP muda
  // em relação ao que gerou os valores atuais — nunca deixa esses campos
  // parecerem válidos para um CEP diferente do que está no campo agora.
  useEffect(() => {
    const digits = normalizeCep(form.zip);
    latestCepDigitsRef.current = digits;

    if (digits !== resolvedCepRef.current) {
      resolvedCepRef.current = null;
      setCepStatus("idle");
      setForm((f) =>
        f.city || f.state || f.neighborhood
          ? { ...f, city: "", state: "", neighborhood: "", address: "" }
          : f
      );
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- liga o indicador de carregamento antes de disparar a consulta assíncrona abaixo
    if (digits.length === 8) runCepLookup(digits);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve reagir a mudanças no próprio CEP
  }, [form.zip]);

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
          couponCode: coupon?.code ?? null,
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
              <div>
                <Input
                  label="CEP"
                  required
                  value={form.zip}
                  onChange={(v) => update("zip", formatCep(v))}
                  placeholder="00000-000"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={9}
                />
                {cepStatus === "loading" && (
                  <p className="mt-1 text-xs text-muted">Buscando endereço...</p>
                )}
                {cepStatus === "not_found" && (
                  <p className="mt-1 text-xs text-accent">
                    CEP não encontrado. Verifique o CEP informado.
                  </p>
                )}
                {cepStatus === "error" && (
                  <p className="mt-1 text-xs text-accent">
                    Não foi possível consultar o CEP agora.{" "}
                    <button
                      type="button"
                      onClick={() => runCepLookup(normalizeCep(form.zip))}
                      className="underline underline-offset-2"
                    >
                      Tentar novamente.
                    </button>
                  </p>
                )}
              </div>
              <Input
                label="Endereço"
                required
                value={form.address}
                onChange={(v) => update("address", v)}
                autoComplete="address-line1"
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
                autoComplete="address-line2"
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
                readOnly
                value={form.city}
                onChange={(v) => update("city", v)}
                placeholder="Preenchida pelo CEP"
                autoComplete="address-level2"
              />
              <Input
                label="Estado"
                required
                readOnly
                value={form.state}
                onChange={(v) => update("state", v)}
                placeholder="UF"
                autoComplete="address-level1"
                maxLength={2}
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
          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="text-muted">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {coupon && (
            <div className="mt-1 flex justify-between text-accent">
              <span>Desconto ({coupon.code})</span>
              <span>-{formatPrice(coupon.discountAmount)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
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
  readOnly,
  autoComplete,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
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
        readOnly={readOnly}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:border-accent ${
          readOnly
            ? "border-border bg-card text-muted"
            : "border-border bg-background"
        }`}
      />
    </div>
  );
}
