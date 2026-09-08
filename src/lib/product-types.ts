export type ColorVariant = {
  name: string;
  /** sempre no formato #RRGGBB */
  hex: string;
  /** opcional: quando vazio, a página do produto usa as imagens gerais */
  images: string[];
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
  /** true = peça já exposta na vitrine mas aguardando preço/descrição final */
  isDraft?: boolean;
};
