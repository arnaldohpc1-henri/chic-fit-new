export function blobErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (msg.includes("No blob credentials") || msg.includes("BLOB_READ_WRITE_TOKEN")) {
    return "Armazenamento de fotos ainda não configurado nesta instalação (falta a variável BLOB_READ_WRITE_TOKEN). Configure o Vercel Blob no projeto.";
  }
  return "Não foi possível salvar agora. Tente novamente em instantes.";
}
