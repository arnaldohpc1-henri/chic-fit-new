export type ColorVariant = {
  name: string;
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
  colors: ColorVariant[];
  /** true = peça já exposta na vitrine mas aguardando preço/descrição final */
  isDraft?: boolean;
};
