import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-xl">Chic &amp; Fit</p>
          <p className="mt-2 text-sm text-muted">{siteConfig.description}</p>
        </div>

        <div className="text-sm">
          <p className="mb-3 font-medium uppercase tracking-wide text-foreground/80">
            Loja
          </p>
          <ul className="space-y-2 text-muted">
            <li>
              <Link href="/loja" className="hover:text-accent">
                Todas as peças
              </Link>
            </li>
            <li>
              <Link href="/carrinho" className="hover:text-accent">
                Carrinho
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="mb-3 font-medium uppercase tracking-wide text-foreground/80">
            Contato
          </p>
          <ul className="space-y-2 text-muted">
            <li>
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="hover:text-accent">
                {siteConfig.email}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.instagram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Chic &amp; Fit. Todos os direitos reservados.
      </div>
    </footer>
  );
}
