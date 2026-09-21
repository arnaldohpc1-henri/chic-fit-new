export type ColorVariant = {
  name: string;
  /** sempre no formato #RRGGBB */
  hex: string;
  /** opcional: quando vazio, a página do produto usa as imagens gerais */
  images: string[];
};

export type ProductVariant = {
  /** chave estável = colorName + size, ex: "Berinjela::P" */
  id: string;
  colorName: string;
  size: string;
  stock: number;
  /** null = usa o preço do produto (estrutura preparada para preço por variação no futuro) */
  price: number | null;
  active: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number | null;
  sizes: string[];
  description: string;
  details: string[];
  /** imagens gerais da peça, usadas quando a cor selecionada não tem foto própria */
  images: string[];
  colors: ColorVariant[];
  /** combinações cor × tamanho com estoque próprio */
  variants: ProductVariant[];
  /** true = peça já exposta na vitrine mas aguardando preço/descrição final */
  isDraft?: boolean;
  /** ISO 8601, gravado no momento da criação (ver POST /api/admin/products) — ausente em peças cadastradas antes deste campo existir, nunca preenchido retroativamente */
  createdAt?: string;
  /**
   * Dados físicos para cotação de frete (Prioridade 12) — pertencem ao
   * produto, não a cada variação de cor×tamanho. Opcionais e nunca
   * preenchidos automaticamente: peças cadastradas antes desses campos
   * existirem ficam com `null`/ausentes até a lojista preencher os valores
   * reais pelo painel. Unidades: kg para peso, cm para as dimensões.
   */
  weight?: number | null;
  height?: number | null;
  width?: number | null;
  length?: number | null;
};
