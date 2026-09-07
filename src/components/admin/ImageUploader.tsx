"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(
            `Formato de "${file.name}" não aceito. Envie em JPG, PNG ou WEBP (fotos .HEIC do iPhone precisam ser convertidas antes — ao compartilhar a foto, escolha a opção "Mais compatível"/JPEG).`
          );
        }

        const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
        const pathname = `products/${crypto.randomUUID()}.${ext}`;

        // Envia direto do navegador para o Blob (não passa pelo servidor),
        // então fotos grandes não esbarram no limite de tamanho de
        // requisição da Vercel.
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
        });
        uploaded.push(blob.url);
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={img}
            className="relative h-24 w-20 overflow-hidden rounded-lg border border-border"
          >
            <Image src={img} alt="" fill sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              aria-label="Remover foto"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-black"
            >
              ×
            </button>
          </div>
        ))}

        <label className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-center text-xs text-muted hover:border-accent hover:text-accent">
          {uploading ? "Enviando..." : "+ Foto"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
