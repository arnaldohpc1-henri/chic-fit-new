import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";

export const WHATSAPP_DEFAULT_MESSAGE =
  "Olá! Vim pelo site da Chic & Fit e gostaria de saber mais sobre os produtos.";

/**
 * Único ponto que monta a URL do wa.me — todo componente deve importar
 * daqui em vez de montar `https://wa.me/${siteConfig.whatsappNumber}` na mão,
 * para o número continuar existindo em um lugar só.
 */
export function buildWhatsAppUrl(message: string = WHATSAPP_DEFAULT_MESSAGE): string {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function productInquiryMessage(
  productName: string,
  color: string | null,
  size: string | null
): string {
  const lines = [`Olá! Gostaria de saber mais sobre o produto ${productName}.`];
  if (color) lines.push(`Cor: ${color}`);
  if (size) lines.push(`Tamanho: ${size}`);
  return lines.join("\n");
}

export function cartInquiryMessage(
  items: { name: string; color: string; size: string; qty: number }[],
  total: number
): string {
  const lines = [
    "Olá! Gostaria de informações sobre meu pedido na Chic & Fit.",
    "",
    "Produtos:",
    ...items.map(
      (i) =>
        `- ${i.name}${i.color ? ` — Cor: ${i.color}` : ""}${i.size ? ` — Tamanho: ${i.size}` : ""} — Qtd: ${i.qty}`
    ),
    "",
    `Total: ${formatPrice(total)}`,
  ];
  return lines.join("\n");
}
