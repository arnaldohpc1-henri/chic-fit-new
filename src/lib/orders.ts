import { promises as fs } from "fs";
import path from "path";
import { Order } from "./order-types";

export type { Order, OrderItem, OrderCustomer } from "./order-types";

const DATA_FILE = path.join(process.cwd(), "data", "orders.json");

async function readAll(): Promise<Order[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

// Melhor esforço: em hospedagens serverless (ex: Vercel) o sistema de
// arquivos é somente leitura/efêmero, então essa escrita falha silenciosamente.
// O pedido em si (retornado por createOrder) não depende dessa persistência —
// veja a nota em src/app/api/pedidos/route.ts sobre o próximo passo (banco de dados).
async function tryPersist(orders: Order[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch {
    // ambiente sem escrita em disco — segue sem persistir
  }
}

function generateOrderId(): string {
  const date = new Date();
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CF-${stamp}-${rand}`;
}

export async function createOrder(
  input: Omit<Order, "id" | "createdAt" | "status">
): Promise<Order> {
  const order: Order = {
    ...input,
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    status: "aguardando_pagamento",
  };

  const orders = await readAll();
  orders.push(order);
  await tryPersist(orders);

  return order;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const orders = await readAll();
  return orders.find((o) => o.id === id);
}
