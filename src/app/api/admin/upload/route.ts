import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { blobErrorMessage } from "@/lib/blob-error";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 4 * 1024 * 1024; // 4MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error:
          "Formato não aceito. Envie a foto em JPG, PNG ou WEBP (fotos .HEIC do iPhone precisam ser convertidas antes — ao compartilhar a foto, escolha a opção \"Mais compatível\"/JPEG).",
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Imagem muito grande (máximo 4MB). Tente uma foto com menos resolução." },
      { status: 400 }
    );
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const pathname = `products/${crypto.randomUUID()}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    return NextResponse.json({ error: blobErrorMessage(err) }, { status: 500 });
  }
}
