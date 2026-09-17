export type OrderItem = {
  productId: string;
  name: string;
  color: string;
  size: string;
  price: number;
  qty: number;
};

export type OrderCustomer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  /** código do cupom realmente aplicado neste pedido, já normalizado — null = nenhum */
  couponCode: string | null;
  /** valor do desconto já calculado e travado no momento da criação do pedido — nunca recalculado depois */
  discountAmount: number;
  /** subtotal - discountAmount (frete não entra aqui, ver Prioridade 15 item 17) */
  total: number;
  status: "aguardando_pagamento";
};
