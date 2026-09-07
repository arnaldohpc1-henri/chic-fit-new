import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/admin" className="font-display text-xl">
            Painel Chic &amp; Fit
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/" target="_blank" className="text-muted hover:text-accent">
              Ver site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
    </div>
  );
}
