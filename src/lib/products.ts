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

async function readCatalog(): Promise<{ products: Product[]; etag?: string }> {
  try {
    // useCache: false lê direto da origem, ignorando o CDN — importante
    // porque logo depois de uma gravação (edições em sequência no painel)
    // uma leitura via CDN pode devolver uma cópia antiga por alguns segundos.
    const result = await get(CATALOG_PATH, { access: "public", useCache: false });
    if (!result || result.statusCode !== 200) {
      throw new Error("Catálogo não encontrado.");
    }
    const text = await new Response(result.stream).text();
    return { products: JSON.parse(text) as Product[], etag: result.blob.etag };
  } catch {
    // Ainda não existe catálogo salvo no Blob — usa os dados iniciais.
    // Assim que o painel salvar qualquer alteração, o Blob passa a ser a fonte.
    return { products: SEED_PRODUCTS, etag: undefined };
  }
}

export async function getProducts(): Promise<Product[]> {
  const { products } = await readCatalog();
  return products;
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
    const { products: current, etag } = await readCatalog();
    const next = mutate(current);

    try {
      await put(CATALOG_PATH, JSON.stringify(next, null, 2), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        ...(etag ? { ifMatch: etag } : {}),
      });
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
