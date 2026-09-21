/**
 * Consulta de CEP via ViaCEP (https://viacep.com.br) — serviço público
 * brasileiro, gratuito, sem autenticação e sem custo. Não há credencial a
 * gerenciar: não existe "secret" para expor nem para esconder aqui.
 *
 * Usado tanto pela rota pública /api/cep/[cep] (autopreenchimento no
 * checkout) quanto por /api/pedidos no momento de criar o pedido — a
 * mesma função roda nos dois lugares para nunca haver duas fontes de
 * verdade sobre "qual UF corresponde a este CEP".
 */

export function normalizeCep(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function isCompleteCep(value: string): boolean {
  return normalizeCep(value).length === 8;
}

export function formatCep(value: string): string {
  const digits = normalizeCep(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export type CepLookupResult =
  | { ok: true; street: string; neighborhood: string; city: string; state: string }
  | { ok: false; reason: "invalid_format" }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "service_error" };

export async function lookupCep(rawCep: string): Promise<CepLookupResult> {
  const cep = normalizeCep(rawCep);
  if (cep.length !== 8) {
    return { ok: false, reason: "invalid_format" };
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, reason: "service_error" };

    const data = await res.json().catch(() => null);
    if (!data || data.erro) return { ok: false, reason: "not_found" };

    const state = typeof data.uf === "string" ? data.uf.trim().toUpperCase() : "";
    if (state.length !== 2) return { ok: false, reason: "service_error" };

    return {
      ok: true,
      street: typeof data.logradouro === "string" ? data.logradouro : "",
      neighborhood: typeof data.bairro === "string" ? data.bairro : "",
      city: typeof data.localidade === "string" ? data.localidade : "",
      state,
    };
  } catch {
    // rede indisponível, timeout, JSON inválido etc — nunca vira "CEP não
    // encontrado": é uma falha temporária de consulta, tratada à parte.
    return { ok: false, reason: "service_error" };
  }
}
