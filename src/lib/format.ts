export function formatPrice(value: number | null): string {
  if (value === null) return "Em breve";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
