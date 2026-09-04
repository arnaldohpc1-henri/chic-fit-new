"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Order } from "@/lib/order-types";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/config/site";

export default function PedidoConfirmadoPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(`chicfit:order:${id}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única do pedido salvo no sessionStorage ao montar
      setOrder(raw ? (JSON.parse(raw) as Order) : null);
    } catch {
      setOrder(null);
    }
  }, [id]);

  if (order === undefined) {
    return null;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl">Pedido não encontrado</h1>
        <p className="mt-3 text-muted">
          Não encontramos os detalhes deste pedido nesta sessão do navegador
          (isso acontece se você recarregar a página ou abrir o link em outro
          dispositivo). Se você já confirmou a compra, fique tranquila: é só
          enviar os detalhes pelo WhatsApp para a gente concluir com você.
        </p>
        <a
          href={`https://wa.me/${siteConfig.whatsappNumber}`}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-block rounded-full bg-[#25D366] px-8 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:opacity-90"
        >
          Falar no WhatsApp
        </a>
        <div className="mt-4">
          <Link href="/loja" className="text-sm text-muted hover:text-accent">
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  const itemsText = order.items
    .map(
      (i) =>
        `- ${i.qty}x ${i.name} (${i.color}${i.size ? `, ${i.size}` : ""}) — ${formatPrice(i.price * i.qty)}`
    )
    .join("\n");

  const message = `Olá! Acabei de fazer o pedido *${order.id}* no site da Chic & Fit.\n\n${itemsText}\n\nSubtotal: ${formatPrice(order.subtotal)}\n\nEndereço: ${order.customer.address}, ${order.customer.number} - ${order.customer.neighborhood}, ${order.customer.city}/${order.customer.state} - CEP ${order.customer.zip}\n\nGostaria de combinar o pagamento e o frete.`;

  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-accent">
        Pedido recebido
      </p>
      <h1 className="mt-3 font-display text-4xl">Obrigada pela compra!</h1>
      <p className="mt-3 text-muted">
        Seu pedido <span className="font-medium text-foreground">{order.id}</span>{" "}
        foi registrado. Para concluir, envie os detalhes para a nossa loja no
        WhatsApp e combine o pagamento e o frete.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-left">
        <h2 className="mb-4 font-display text-xl">Resumo</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex justify-between gap-3">
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
          <span>{formatPrice(order.subtotal)}</span>
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-block w-full rounded-full bg-[#25D366] px-8 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:opacity-90 sm:w-auto"
      >
        Enviar pedido pelo WhatsApp
      </a>

      <div className="mt-4">
        <Link href="/loja" className="text-sm text-muted hover:text-accent">
          Voltar para a loja
        </Link>
      </div>
    </div>
  );
}
