import { NextRequest, NextResponse } from "next/server";
import { lookupCep } from "@/lib/cep";

export const dynamic = "force-dynamic";

/**
 * Endpoint público (fora de /api/admin, sem login) — só repassa o
 * resultado da consulta de CEP, nada sensível. Usado pelo checkout para
 * autopreencher o endereço; a mesma lógica é reaproveitada por
 * /api/pedidos para resolver a UF de forma confiável no servidor.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cep: string }> }
) {
  const { cep } = await params;
  const result = await lookupCep(cep);

  if (!result.ok) {
    const status =
      result.reason === "invalid_format" ? 400 : result.reason === "not_found" ? 404 : 502;
    return NextResponse.json({ found: false, reason: result.reason }, { status });
  }

  return NextResponse.json({ found: true, ...result });
}
