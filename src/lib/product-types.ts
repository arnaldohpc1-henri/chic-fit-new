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
};
