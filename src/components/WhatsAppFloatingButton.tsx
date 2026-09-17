import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

/**
 * Botão fixo de contato geral — visível em todas as páginas públicas
 * (fora do painel administrativo, que tem seu próprio layout). O padding
 * usa `env(safe-area-inset-*)` para não ficar sobre a barra de gestos do
 * iOS/Android em telas com "notch".
 */
export function WhatsAppFloatingButton() {
  return (
    <a
      href={buildWhatsAppUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      title="Falar no WhatsApp"
      className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#20bd5a]"
      style={{
        bottom: "max(1.25rem, env(safe-area-inset-bottom))",
        right: "max(1.25rem, env(safe-area-inset-right))",
      }}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
