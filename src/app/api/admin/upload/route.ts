import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/admin-auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB — o arquivo vai direto do navegador
// para o Blob (não passa pelo corpo desta função), então não esbarra no
// limite de tamanho de requisição da Vercel que quebrava fotos maiores.

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        // Esta função só roda no passo de "gerar token" (pedido feito pelo
        // navegador da administradora) — é aqui que checamos a sessão.
        const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
        const valid = await isValidSessionToken(token);
        if (!valid) {
          throw new Error("Não autorizado.");
        }

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_SIZE,
          addRandomSuffix: false,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao preparar o envio da foto." },
      { status: 400 }
    );
  }
}
