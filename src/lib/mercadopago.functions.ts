import { createServerFn } from "@tanstack/react-start";
import { resolveBaseUrl } from "./app-url";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const chargeInput = z.object({
  saleCode: z.string().min(1).max(64),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        quantity: z.number().positive().max(10000),
        unitPrice: z.number().nonnegative().max(1000000),
      }),
    )
    .min(1)
    .max(100),
  discount: z.number().nonnegative().max(1000000).default(0),
});

/** Cria a preferência de pagamento (Checkout Pro) e devolve o link. */
export const createCharge = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chargeInput.parse(data))
  .handler(async ({ data }) => {
    const mp = await import("./mercadopago.server");
    if (!mp.hasAccessToken()) {
      return { ok: false as const, error: "Access Token do Mercado Pago não configurado." };
    }

    const baseUrl = resolveBaseUrl(getRequest().url);

    const items = data.items.map((i) => ({
      title: i.name,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }));

    if (data.discount > 0) {
      items.push({ title: "Desconto", quantity: 1, unit_price: -data.discount });
    }

    try {
      const pref = await mp.createPreference({
        items,
        externalReference: data.saleCode,
        notificationUrl: `${baseUrl}/api/public/webhooks/mercadopago`,
        backUrl: baseUrl,
      });

      return {
        ok: true as const,
        preferenceId: pref.id,
        initPoint: mp.isSandboxToken() ? (pref.sandbox_init_point ?? pref.init_point) : pref.init_point,
        sandbox: mp.isSandboxToken(),
      };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
  });

/** Consulta o status real da cobrança no Mercado Pago (fallback ao Realtime). */
export const getChargeStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ saleCode: z.string().min(1).max(64) }).parse(data))
  .handler(async ({ data }) => {
    const mp = await import("./mercadopago.server");
    if (!mp.hasAccessToken()) return { status: "pendente" as const, found: false };

    const payments = await mp.searchPaymentsByReference(data.saleCode);
    const latest = payments[0];
    if (!latest) return { status: "pendente" as const, found: false };

    const status = mp.mapStatus(latest.status);
    // Mantém o banco em dia mesmo se o webhook não chegou.
    await mp.applyPaymentToSale(data.saleCode, status, String(latest.id));
    return { status, found: true };
  });

/** Status da configuração (nunca devolve o valor dos secrets). */
export const getMercadoPagoConfig = createServerFn({ method: "GET" }).handler(async () => {
  const mp = await import("./mercadopago.server");
  const publicKey = process.env["MERCADOPAGO_PUBLIC_KEY"] || "";
  const baseUrl = resolveBaseUrl(getRequest().url);
  return {
    accessTokenConfigured: mp.hasAccessToken(),
    publicKeyConfigured: Boolean(publicKey),
    publicKeyPreview: publicKey ? `${publicKey.slice(0, 8)}••••${publicKey.slice(-4)}` : "",
    sandbox: mp.isSandboxToken(),
    webhookUrl: `${baseUrl.replace(/\/$/, "")}/api/public/webhooks/mercadopago`,
    databaseConfigured: Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"] && process.env["SUPABASE_URL"]),
  };
});
