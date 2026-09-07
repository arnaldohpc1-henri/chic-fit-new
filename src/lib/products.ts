import { put, get, BlobPreconditionFailedError } from "@vercel/blob";
import type { Product } from "./product-types";

export type { Product, ColorVariant } from "./product-types";

const CATALOG_PATH = "data/products.json";

// Catálogo inicial — usado apenas até a primeira gravação feita pelo painel
// administrativo (a partir daí, os dados reais ficam no Vercel Blob).
const SEED_PRODUCTS: Product[] = [
  {
    id: "macaquinho-canelado",
    slug: "macaquinho-canelado",
    name: "Macaquinho Canelado",
    category: "Macaquinhos",
    price: 130,
    sizes: ["Único (veste do 36 ao 42)"],
    description:
      "Tecido de alta qualidade, com alta compressão, macio e confortável, com ótimo caimento e aquele toque que valoriza a peça.",
    details: [
      "Tecido canelado de alta compressão",
      "Toque macio e confortável",
      "Caimento que valoriza o corpo",
      "Tamanho único — veste do 36 ao 42",
    ],
    colors: [
      {
        name: "Chumbo",
        images: [
          "/products/macaquinho-canelado-chumbo-1.jpg",
          "/products/macaquinho-canelado-chumbo-costas.jpg",
        ],
      },
    ],
  },
  {
    id: "macaquinho-canelado-pink",
    slug: "macaquinho-canelado-pink",
    name: "Macaquinho Canelado",
    category: "Macaquinhos",
    price: null,
    sizes: [],
    description:
      "Detalhes completos (preço, tamanhos e descrição) chegando em breve. Fale com a gente pelo WhatsApp para mais informações sobre esta peça.",
    details: [],
    colors: [
      {
        name: "Pink",
        images: [
          "/products/macaquinho-canelado-pink-1.jpg",
          "/products/macaquinho-canelado-pink-2.jpg",
        ],
      },
    ],
    isDraft: true,
  },
  {
    id: "macaquinho-canelado-amarelo",
    slug: "macaquinho-canelado-amarelo",
    name: "Macaquinho Canelado",
    category: "Macaquinhos",
    price: null,
    sizes: [],
    description:
      "Detalhes completos (preço, tamanhos e descrição) chegando em breve. Fale com a gente pelo WhatsApp para mais informações sobre esta peça.",
    details: [],
    colors: [
      {
        name: "Amarelo",
        images: [
          "/products/macaquinho-canelado-amarelo-frente.jpg",
          "/products/macaquinho-canelado-amarelo-costas.jpg",
        ],
      },
    ],
    isDraft: true,
  },
  {
    id: "conjunto-fitness-preto",
    slug: "conjunto-fitness-preto",
    name: "Conjunto Fitness Cropped + Legging",
    category: "Conjuntos",
    price: null,
    sizes: [],
    description:
      "Detalhes completos (preço, tamanhos e descrição) chegando em breve. Fale com a gente pelo WhatsApp para mais informações sobre esta peça.",
    details: [],
    colors: [
      {
        name: "Preto",
        images: ["/products/conjunto-fitness-preto-1.jpg"],
      },
    ],
    isDraft: true,
  },
  {
    id: "conjunto-fitness-vermelho",
    slug: "conjunto-fitness-vermelho",
    name: "Conjunto Fitness Top + Legging",
    category: "Conjuntos",
    price: null,
    sizes: [],
    description:
      "Detalhes completos (preço, tamanhos e descrição) chegando em breve. Fale com a gente pelo WhatsApp para mais informações sobre esta peça.",
    details: [],
    colors: [
      {
        name: "Vermelho",
        images: [
          "/products/conjunto-fitness-vermelho-1.jpg",
          "/products/conjunto-fitness-vermelho-2.jpg",
        ],
      },
    ],
    isDraft: true,
  },
];

/**
 * Lê o catálogo salvo no Blob para uma GRAVAÇÃO. Nunca cai para os dados de
 * exemplo aqui — nem quando get() devolve null. Já vimos get() retornar
 * null mesmo com o arquivo existindo (instabilidade pontual do Blob), e se
 * isso alimentasse uma gravação, o catálogo real seria substituído pelos
 * dados de exemplo. Se não der pra confirmar o conteúdo real, a operação
 * falha visivelmente em vez de arriscar apagar dados de verdade.
 */
async function readCatalogForMutation(): Promise<{ products: Product[]; etag?: string }> {
  // useCache: false lê direto da origem (ignora qualquer CDN).
  const result = await get(CATALOG_PATH, { access: "public", useCache: false });
  if (!result) {
    throw new Error(
      "Não foi possível confirmar o catálogo atual no Blob (resposta vazia)."
    );
  }
  if (result.statusCode !== 200) {
    throw new Error("Resposta inesperada do Blob ao ler o catálogo.");
  }
  const text = await new Response(result.stream).text();
  const products = JSON.parse(text) as Product[];
  return { products, etag: result.blob.etag };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const result = await get(CATALOG_PATH, { access: "public", useCache: false });
    if (!result || result.statusCode !== 200) {
      // Pode ser "realmente nunca salvo" ou uma falha pontual de leitura —
      // para uma página pública, mostrar o catálogo inicial é melhor do
      // que quebrar a página. Isso não grava nada, então é seguro.
      return SEED_PRODUCTS;
    }
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as Product[];
  } catch {
    return SEED_PRODUCTS;
  }
}

/**
 * Espera até a leitura direto da origem devolver exatamente o conteúdo
 * recém-gravado (ou desiste após algumas tentativas). Usado logo após um
 * put() bem-sucedido para reduzir a chance de uma ação seguinte no painel
 * ler uma cópia desatualizada e reverter esta gravação sem querer.
 */
async function waitUntilReadable(expected: string): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await new Promise((resolve) => setTimeout(resolve, 250 * (i + 1)));
    try {
      const result = await get(CATALOG_PATH, { access: "public", useCache: false });
      if (result && result.statusCode === 200) {
        const text = await new Response(result.stream).text();
        if (text === expected) return;
      }
    } catch {
      // ignora e tenta de novo
    }
  }
  // Não deu para confirmar dentro do tempo — segue mesmo assim. A gravação
  // em si foi bem-sucedida; isso só reduz (não garante) a janela de risco.
}

/**
 * Aplica uma alteração no catálogo de forma segura contra escritas
 * concorrentes (ex: excluir duas peças em sequência rápida no painel).
 * Usa o ETag do arquivo salvo no Blob como trava otimista: se outra
 * gravação aconteceu entre a leitura e a escrita, tenta de novo com os
 * dados mais recentes em vez de sobrescrever e perder essa outra alteração.
 */
export async function mutateProducts(
  mutate: (current: Product[]) => Product[]
): Promise<Product[]> {
  const MAX_ATTEMPTS = 10;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let current: Product[];
    let etag: string | undefined;

    try {
      ({ products: current, etag } = await readCatalogForMutation());
    } catch (err) {
      // Leitura falhou (já vimos isso acontecer pontualmente com o Blob) —
      // tenta de novo em vez de desistir na primeira falha.
      if (attempt === MAX_ATTEMPTS) throw err;
      const backoff = 80 * attempt + Math.random() * 150;
      await new Promise((resolve) => setTimeout(resolve, backoff));
      continue;
    }

    const next = mutate(current);
    const serialized = JSON.stringify(next, null, 2);

    // O Blob devolve ETags "fracos" (prefixo W/), que o próprio ifMatch do
    // Blob nunca reconhece como iguais em comparação estrita — sem remover
    // o prefixo, a gravação falhava por "ETag mismatch" mesmo sem nenhuma
    // outra escrita concorrente.
    const strongEtag = etag?.replace(/^W\//, "");

    try {
      await put(CATALOG_PATH, serialized, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        ...(strongEtag ? { ifMatch: strongEtag } : {}),
      });
      // Confirma que a gravação já está visível antes de responder "ok":
      // o armazenamento pode levar um instante para propagar, e sem essa
      // confirmação uma segunda ação logo em seguida (outro clique no
      // painel) podia ler uma versão desatualizada e desfazer esta.
      await waitUntilReadable(serialized);
      return next;
    } catch (err) {
      // Checagem por mensagem em vez de `instanceof`: em produção o
      // bundler pode duplicar a classe de erro em chunks diferentes,
      // fazendo `instanceof BlobPreconditionFailedError` falhar mesmo
      // sendo o mesmo tipo de erro.
      const message = err instanceof Error ? err.message : "";
      const isConflict =
        err instanceof BlobPreconditionFailedError ||
        message.includes("Precondition failed") ||
        message.includes("ETag mismatch");
      if (!isConflict || attempt === MAX_ATTEMPTS) throw err;
      // outra gravação venceu a corrida — espera um pouco (com variação
      // aleatória, pra não colidir de novo com quem também está
      // tentando de novo agora) e lê os dados mais recentes na próxima volta
      const backoff = 80 * attempt + Math.random() * 150;
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  throw new Error("Não foi possível salvar após várias tentativas.");
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

export async function getCategories(): Promise<string[]> {
  const products = await getProducts();
  return Array.from(new Set(products.map((p) => p.category)));
}
