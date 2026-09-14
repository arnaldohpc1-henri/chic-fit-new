import Link from "next/link";
import { ImageBanner } from "@/components/ImageBanner";
import { ProductCard } from "@/components/ProductCard";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const featured = await getProducts();

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 pt-8">
        <ImageBanner
          src="/banners/site-no-ar.jpg"
          alt="Nosso site está no ar — aproveite para garantir seus looks favoritos"
          href="/loja"
          width={4269}
          height={2400}
          priority
        />
      </section>

      <section className="mx-auto my-8 max-w-[1920px]">
        <ImageBanner
          src="/banners/capa-colecao.jpg"
          alt="Disciplina também é autoamor — conheça a coleção"
          href="/loja"
          width={4269}
          height={2400}
          rounded={false}
          sizes="100vw"
        />
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

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <ImageBanner
          src="/banners/capa-colecao.jpg"
          alt="Disciplina também é autoamor — conheça a coleção"
          href="/loja"
          width={4269}
          height={2400}
        />
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

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageBanner
            src="/banners/parcelamento-facilitado.jpg"
            alt="Parcelamento facilitado em até 3x sem juros no cartão"
            width={4269}
            height={2400}
          />
          <ImageBanner
            src="/banners/cupom-desconto.jpg"
            alt="Cupom de desconto — use o cupom PRIMEIRACOMPRA e ganhe 10% off em todo o site"
            width={4269}
            height={2400}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <ImageBanner
          src="/banners/envio-todo-brasil.jpg"
          alt="Compra segura, envio para todo o Brasil e atendimento personalizado"
          width={4269}
          height={2400}
        />
      </section>
    </div>
  );
}
