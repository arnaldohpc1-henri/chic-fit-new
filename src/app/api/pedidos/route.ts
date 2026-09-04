import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { OrderItem } from "@/lib/order-types";

type RequestBody = {
  customer: {
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
  items: OrderItem[];
  subtotal: number;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<RequestBody>;

  if (!body.customer || !body.items || body.items.length === 0) {
    return NextResponse.json(
      { error: "Dados do pedido incompletos." },
      { status: 400 }
    );
  }

  const { name, email, phone, address, number, neighborhood, city, state, zip } =
    body.customer;
  if (!name || !email || !phone || !address || !number || !neighborhood || !city || !state || !zip) {
    return NextResponse.json(
      { error: "Preencha todos os campos obrigatórios de entrega." },
      { status: 400 }
    );
  }

  // NOTE: pagamento ainda não integrado a um gateway (Stripe/Mercado Pago) e
  // ainda não há banco de dados — createOrder tenta persistir em disco (só
  // funciona rodando localmente) mas o pedido retornado aqui não depende
  // disso: o cliente guarda esse objeto e usa para montar a confirmação e a
  // mensagem de WhatsApp. Quando integrar um gateway, criar a cobrança aqui
  // antes de responder, e quando integrar um banco de dados, trocar
  // createOrder por uma escrita real.
  const order = await createOrder({
    customer: body.customer as RequestBody["customer"],
    items: body.items,
    subtotal: body.subtotal ?? 0,
  });

  return NextResponse.json(order, { status: 201 });
}
