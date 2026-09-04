export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  color: string;
  price: number | null;
  sizes: string[];
  description: string;
  details: string[];
  images: string[];
  /** true = peça já exposta na vitrine mas aguardando preço/descrição final */
  isDraft?: boolean;
};

export const products: Product[] = [
  {
    id: "macaquinho-canelado-chumbo",
    slug: "macaquinho-canelado-chumbo",
    name: "Macaquinho Canelado",
    category: "Macaquinhos",
    color: "Chumbo",
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
    images: [
      "/products/macaquinho-canelado-chumbo-1.jpg",
      "/products/macaquinho-canelado-chumbo-2.jpg",
      "/products/macaquinho-canelado-chumbo-3.jpg",
    ],
  },
  {
    id: "macaquinho-canelado-pink",
    slug: "macaquinho-canelado-pink",
    name: "Macaquinho Canelado",
    category: "Macaquinhos",
    color: "Pink",
    price: null,
    sizes: [],
    description:
      "Detalhes completos (preço, tamanhos e descrição) chegando em breve. Fale com a gente pelo WhatsApp para mais informações sobre esta peça.",
    details: [],
    images: [
      "/products/macaquinho-canelado-pink-1.jpg",
      "/products/macaquinho-canelado-pink-2.jpg",
    ],
    isDraft: true,
  },
  {
    id: "macaquinho-canelado-amarelo",
    slug: "macaquinho-canelado-amarelo",
    name: "Macaquinho Canelado",
    category: "Macaquinhos",
    color: "Amarelo",
    price: null,
    sizes: [],
    description:
      "Detalhes completos (preço, tamanhos e descrição) chegando em breve. Fale com a gente pelo WhatsApp para mais informações sobre esta peça.",
    details: [],
    images: ["/products/macaquinho-canelado-amarelo-1.jpg"],
    isDraft: true,
  },
  {
    id: "conjunto-fitness-preto",
    slug: "conjunto-fitness-preto",
    name: "Conjunto Fitness Cropped + Legging",
    category: "Conjuntos",
    color: "Preto",
    price: null,
    sizes: [],
    description:
      "Detalhes completos (preço, tamanhos e descrição) chegando em breve. Fale com a gente pelo WhatsApp para mais informações sobre esta peça.",
    details: [],
    images: ["/products/conjunto-fitness-preto-1.jpg"],
    isDraft: true,
  },
  {
    id: "conjunto-fitness-vermelho",
    slug: "conjunto-fitness-vermelho",
    name: "Conjunto Fitness Top + Legging",
    category: "Conjuntos",
    color: "Vermelho",
    price: null,
    sizes: [],
    description:
      "Detalhes completos (preço, tamanhos e descrição) chegando em breve. Fale com a gente pelo WhatsApp para mais informações sobre esta peça.",
    details: [],
    images: [
      "/products/conjunto-fitness-vermelho-1.jpg",
      "/products/conjunto-fitness-vermelho-2.jpg",
    ],
    isDraft: true,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCategories(): string[] {
  return Array.from(new Set(products.map((p) => p.category)));
}
