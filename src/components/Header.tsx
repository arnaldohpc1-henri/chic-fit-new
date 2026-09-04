"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/config/site";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/loja", label: "Loja" },
  { href: "/loja?categoria=Macaquinhos", label: "Macaquinhos" },
  { href: "/loja?categoria=Conjuntos", label: "Conjuntos" },
];

function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(value ? `/loja?busca=${encodeURIComponent(value)}` : "/loja");
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar"
        className="w-full rounded-full border border-border bg-background py-2 pl-4 pr-9 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-accent"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </button>
    </form>
  );
}

function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/carrinho" className="relative inline-flex" aria-label="Ver carrinho">
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
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4">
        <div className="hidden sm:block sm:max-w-[220px]">
          <SearchBox />
        </div>

        <button className="sm:hidden" aria-label="Abrir menu" onClick={() => setOpen((v) => !v)}>
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

        <Link href="/" className="justify-self-center">
          <Image
            src="/logo.png"
            alt={siteConfig.name}
            width={96}
            height={96}
            priority
            className="h-16 w-16 object-contain sm:h-20 sm:w-20"
          />
        </Link>

        <div className="flex justify-end">
          <CartLink />
        </div>
      </div>

      <nav className="hidden justify-center gap-8 border-t border-border py-3 text-sm uppercase tracking-wide sm:flex">
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

      {open && (
        <div className="space-y-3 border-t border-border bg-background px-5 py-4 sm:hidden">
          <SearchBox />
          <nav className="flex flex-col gap-1 text-sm uppercase tracking-wide">
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
        </div>
      )}
    </header>
  );
}
