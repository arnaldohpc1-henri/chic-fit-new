import Link from "next/link";
import { Carousel, type CarouselSlide } from "@/components/Carousel";
import { ProductCard } from "@/components/ProductCard";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

const HOME_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    src: "/banners/sofisticada.jpg",
    alt: "Sofisticada e feminina — nova coleção Chic & Fit",
    width: 3375,
    height: 4219,
    desktopSrc: "/banners/sofisticada-desktop.jpg",
    desktopWidth: 4269,
    desktopHeight: 2400,
  },
  {
    src: "/banners/colecao-elegance.jpg",
    alt: "Coleção Elegance",
    href: "/loja",
    width: 3375,
    height: 4219,
    desktopSrc: "/banners/colecao-elegance-desktop.jpg",
    desktopWidth: 4269,
    desktopHeight: 2400,
  },
  {
    src: "/banners/parcelamento-facilitado.jpg",
    alt: "Parcelamento facilitado em até 3x sem juros no cartão",
    width: 4269,
    height: 2400,
  },
  {
    src: "/banners/cupom.jpg",
    alt: "10% off na primeira compra com o cupom CHIC10",
    width: 3375,
    height: 4219,
    desktopSrc: "/banners/cupom-desktop.jpg",
    desktopWidth: 4269,
    desktopHeight: 2400,
  },
  {
    src: "/banners/frete.jpg",
    alt: "Frete grátis para Igarapé do Meio-MA — compre agora",
    href: "/loja",
    width: 3375,
    height: 4219,
    desktopSrc: "/banners/frete-desktop.jpg",
    desktopWidth: 4269,
    desktopHeight: 2400,
  },
];

export default async function Home() {
  const featured = await getProducts();

  return (
    <div>
      <section className="mx-auto max-w-[1920px]">
        <Carousel slides={HOME_CAROUSEL_SLIDES} />
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
