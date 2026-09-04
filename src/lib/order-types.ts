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
  status: "aguardando_pagamento";
};
