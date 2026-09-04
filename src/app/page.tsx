import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";
import { siteConfig } from "@/config/site";

export default function Home() {
  const featured = products.slice(0, 4);

  return (
    <div>
      <section className="relative flex min-h-[80vh] items-end overflow-hidden bg-foreground text-white sm:min-h-[90vh]">
        <Image
          src="/products/macaquinho-canelado-chumbo-1.jpg"
          alt="Modelo vestindo macaquinho canelado Chic & Fit"
          fill
          priority
          className="object-cover object-top opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-32">
          <p className="text-xs uppercase tracking-[0.3em] text-white/80">
            Nova coleção
          </p>
          <h1 className="mt-4 max-w-lg font-display text-5xl leading-[1.05] sm:text-6xl">
            {siteConfig.tagline}
          </h1>
          <p className="mt-4 max-w-md text-white/85">{siteConfig.description}</p>
          <Link
            href="/loja"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-sm font-medium uppercase tracking-wide text-foreground transition hover:bg-accent hover:text-white"
          >
            Ver coleção
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
              Vitrine
            </p>
            <h2 className="mt-2 font-display text-3xl">Peças em destaque</h2>
          </div>
          <Link
            href="/loja"
            className="hidden text-sm uppercase tracking-wide text-muted hover:text-accent sm:block"
          >
            Ver tudo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/loja"
            className="text-sm uppercase tracking-wide text-accent"
          >
            Ver tudo
          </Link>
        </div>
      </section>

      <section className="bg-card py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-3">
          {[
            {
              title: "Tecido premium",
              text: "Alta compressão, toque macio e caimento perfeito em cada peça.",
            },
            {
              title: "Feito para o treino",
              text: "Peças pensadas para acompanhar seu movimento, do treino ao dia a dia.",
            },
            {
              title: "Atendimento próximo",
              text: "Dúvidas sobre tamanho ou cor? Fale com a gente pelo WhatsApp.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-xl">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
