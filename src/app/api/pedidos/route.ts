import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { decrementStockForOrder } from "@/lib/products";
import { OrderItem } from "@/lib/order-types";
import { getCouponByCode, incrementCouponUsage } from "@/lib/coupons";
import { evaluateCoupon } from "@/lib/coupon-rules";

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
  /** opcional — código digitado no carrinho, revalidado aqui do zero */
  couponCode?: string | null;
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

  // O subtotal é recalculado aqui a partir dos itens em vez de aceitar o
  // valor enviado pelo navegador — o desconto do cupom é sempre calculado
  // sobre esse valor, nunca sobre um subtotal/desconto/total informado
  // diretamente pelo cliente (regra de segurança da Prioridade 15).
  const subtotal = body.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  let couponCode: string | null = null;
  let discountAmount = 0;

  if (body.couponCode && body.couponCode.trim()) {
    const coupon = await getCouponByCode(body.couponCode);
    const result = evaluateCoupon(coupon, subtotal);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    couponCode = coupon!.code;
    discountAmount = result.discountAmount;
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
    subtotal,
    couponCode,
    discountAmount,
    total: subtotal - discountAmount,
  });

  // Best-effort, mesmo padrão da baixa de estoque abaixo: se o cupom deixar
  // de ser aplicável entre a criação do pedido e esta chamada (corrida rara),
  // o pedido já foi criado com o desconto correto travado — só a contagem de
  // uso é que pode ficar levemente desatualizada, nunca o valor cobrado.
  if (couponCode) {
    try {
      await incrementCouponUsage(couponCode);
    } catch (err) {
      console.error(`Falha ao contabilizar uso do cupom ${couponCode}`, err);
    }
  }

  // Best-effort: a baixa de estoque não deve derrubar o pedido já
  // confirmado caso o Blob tenha um problema pontual de escrita.
  try {
    await decrementStockForOrder(
      body.items.map((i) => ({ productId: i.productId, color: i.color, size: i.size, qty: i.qty }))
    );
  } catch (err) {
    console.error(`Falha ao baixar estoque do pedido ${order.id}`, err);
  }

  return NextResponse.json(order, { status: 201 });
}
