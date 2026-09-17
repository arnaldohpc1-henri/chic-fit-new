"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Peças" },
  { href: "/admin/cupons", label: "Cupons" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-6 text-sm uppercase tracking-wide">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`border-b-2 py-3 transition ${
              active ? "border-accent text-accent" : "border-transparent text-muted hover:text-accent"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
