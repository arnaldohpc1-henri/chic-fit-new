export type DiscountType = "percentual" | "fixo";

export type Coupon = {
  id: string;
  /** sempre normalizado para MAIÚSCULAS, sem espaços nas pontas */
  code: string;
  type: DiscountType;
  /** percentual: 0–100 · fixo: valor em reais */
  value: number;
  active: boolean;
  /** ISO "YYYY-MM-DD"; null = sem data de início */
  startDate: string | null;
  /** ISO "YYYY-MM-DD"; null = sem data de término */
  endDate: string | null;
  /** 0 = sem valor mínimo exigido */
  minPurchase: number;
  /** null = uso ilimitado */
  usageLimit: number | null;
  /** contagem real de pedidos criados com este cupom — nunca inventada */
  usageCount: number;
  /**
   * Preparado para uma futura verificação real de "primeira compra". Sem
   * conta de cliente/login no site, não há como confirmar isso hoje: quando
   * true, o cupom é bloqueado com uma mensagem explicando a limitação, em
   * vez de fingir validar algo que o sistema não consegue verificar.
   */
  firstPurchaseOnly: boolean;
  /**
   * Preparado para uma futura limitação de desconto máximo (ex: "20% até
   * R$50"). Sem interface no painel por enquanto — nenhum cupom usa isso.
   */
  maxDiscount: number | null;
  /** ISO 8601, gravado na criação — ausente em cupons criados antes deste campo existir */
  createdAt?: string;
};
