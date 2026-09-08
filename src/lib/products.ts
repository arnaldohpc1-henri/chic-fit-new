import { put, head, BlobPreconditionFailedError } from "@vercel/blob";
import type { Product, ColorVariant } from "./product-types";

export type { Product, ColorVariant } from "./product-types";

const CATALOG_PATH = "data/products.json";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_HEX = "#CCCCCC";

export function isValidHex(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

export function normalizeHex(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Deixa produtos vindos do Blob (ou do catálogo inicial) sempre no formato
 * atual, mesmo que tenham sido salvos antes da cor ganhar `hex` e a peça
 * ganhar imagens gerais — isso é o que mantém peças antigas funcionando sem
 * precisar de uma migration.
 */
export function normalizeColor(color: Partial<ColorVariant> & { name: string }): ColorVariant {
  return {
    name: color.name,
    hex: isValidHex(color.hex) ? normalizeHex(color.hex) : DEFAULT_HEX,
    images: Array.isArray(color.images) ? color.images : [],
  };
}

export function normalizeProduct(product: Product): Product {
  const colors = Array.isArray(product.colors) ? product.colors.map(normalizeColor) : [];
  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : colors.find((c) => c.images.length > 0)?.images ?? [];

  return { ...product, images, colors };
}

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
    images: [],
    colors: [
      {
        name: "Chumbo",
        hex: "#4A4A4A",
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
    images: [],
    colors: [
      {
        name: "Pink",
        hex: "#FF69B4",
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
    images: [],
    colors: [
      {
        name: "Amarelo",
        hex: "#FFD400",
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
    images: [],
    colors: [
      {
        name: "Preto",
        hex: "#000000",
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
    images: [],
    colors: [
      {
        name: "Vermelho",
        hex: "#C0392B",
        images: [
          "/products/conjunto-fitness-vermelho-1.jpg",
          "/products/conjunto-fitness-vermelho-2.jpg",
        ],
      },
    ],
    isDraft: true,
  },
];

// head() (metadados/ETag) provou ser confiável nos testes. get() com
// useCache:false, que deveria ler direto da origem, se mostrou instável
// (403 esporádico, ou null mesmo com o arquivo existindo) quando chamada
// de dentro da função serverless — por isso a leitura de conteúdo usa
// fetch() na URL pública (com cache-busting) em vez de get().
async function fetchCatalogBody(url: string): Promise<Product[]> {
  const res = await fetch(`${url}?t=${Date.now()}-${Math.random()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Falha ao buscar catálogo salvo (status ${res.status}).`);
  return (await res.json()) as Product[];
}

/**
 * Lê o catálogo salvo no Blob para uma GRAVAÇÃO. Nunca cai para os dados de
 * exemplo aqui: se não der pra confirmar o conteúdo real (blob realmente
 * inexistente é a única exceção), a operação falha visivelmente em vez de
 * arriscar apagar dados de verdade.
 */
async function readCatalogForMutation(): Promise<{ products: Product[]; etag?: string }> {
  const info = await head(CATALOG_PATH);
  const products = await fetchCatalogBody(info.url);
  return { products, etag: info.etag };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const info = await head(CATALOG_PATH);
    const products = await fetchCatalogBody(info.url);
    return products.map(normalizeProduct);
  } catch {
    // Pode ser "realmente nunca salvo" ou uma falha pontual de leitura —
    // para uma página pública, mostrar o catálogo inicial é melhor do que
    // quebrar a página. Isso não grava nada, então é seguro.
    return SEED_PRODUCTS.map(normalizeProduct);
  }
}

/**
 * Espera até a leitura direto da origem devolver exatamente o conteúdo
 * recém-gravado (ou desiste após algumas tentativas). Usado logo após um
 * put() bem-sucedido para reduzir a chance de uma ação seguinte no painel
 * ler uma cópia desatualizada e reverter esta gravação sem querer.
 */
async function waitUntilReadable(expected: string): Promise<void> {
  for (let i = 0; i < 8; i++) {
    await new Promise((resolve) => setTimeout(resolve, 300 * (i + 1)));
    try {
      const info = await head(CATALOG_PATH);
      const res = await fetch(`${info.url}?t=${Date.now()}-${Math.random()}`, {
        cache: "no-store",
      });
      if (res.ok && (await res.text()) === expected) return;
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
