/** URL pública do app usada em webhooks e back_urls do Mercado Pago. */
export const PUBLIC_APP_URL = "https://valyra.lovable.app";

/**
 * Resolve a base URL pública. Em desenvolvimento (localhost) o Mercado Pago
 * não aceita a URL, então usamos sempre o domínio publicado.
 */
export function resolveBaseUrl(requestUrl: string): string {
  const env = process.env["APP_BASE_URL"];
  if (env) return env.replace(/\/$/, "");
  try {
    const origin = new URL(requestUrl).origin;
    if (/localhost|127\.0\.0\.1|\[::1\]/.test(origin)) return PUBLIC_APP_URL;
    return origin.replace(/\/$/, "");
  } catch {
    return PUBLIC_APP_URL;
  }
}
