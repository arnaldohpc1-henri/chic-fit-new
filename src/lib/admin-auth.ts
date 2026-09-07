// Usa a Web Crypto API (em vez do módulo "crypto" do Node) para que este
// arquivo funcione tanto nas rotas admin quanto no middleware (Edge runtime).

export const ADMIN_COOKIE_NAME = "chicfit_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSign(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return toHex(signature);
}

function requireSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET não configurada nas variáveis de ambiente."
    );
  }
  return secret;
}

export async function createSessionToken(): Promise<string> {
  const secret = requireSecret();
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = String(expires);
  const signature = await hmacSign(secret, payload);
  return `${payload}.${signature}`;
}

export async function isValidSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const expected = await hmacSign(secret, payload);
  if (!timingSafeEqualStr(signature, expected)) return false;

  const expires = Number(payload);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  return true;
}

export function checkPassword(candidate: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  return timingSafeEqualStr(candidate, real);
}
