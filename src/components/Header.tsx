"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/config/site";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/loja", label: "Loja" },
  { href: "/loja?categoria=Macaquinhos", label: "Macaquinhos" },
  { href: "/loja?categoria=Conjuntos", label: "Conjuntos" },
];

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-2xl tracking-wide">
          Chic <span className="text-accent">&amp;</span> Fit
        </Link>

        <nav className="hidden gap-8 text-sm uppercase tracking-wide md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-foreground/80 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/carrinho"
            className="relative flex items-center gap-2 text-sm uppercase tracking-wide"
            aria-label="Ver carrinho"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.994-4.693 2.602-7.153.115-.464-.235-.897-.712-.897H5.606M7.5 14.25 5.106 5.272M10.5 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm9 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
            <span className="hidden sm:inline">Carrinho</span>
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-medium text-white">
                {count}
              </span>
            )}
          </Link>

          <button
            className="md:hidden"
            aria-label="Abrir menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border bg-background px-5 py-3 text-sm uppercase tracking-wide md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="py-2 text-foreground/80 hover:text-accent"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`https://wa.me/${siteConfig.whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="py-2 text-foreground/80 hover:text-accent"
          >
            Fale no WhatsApp
          </a>
        </nav>
      )}
    </header>
  );
}
