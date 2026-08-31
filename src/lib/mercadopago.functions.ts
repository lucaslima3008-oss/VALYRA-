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
    if (!(await mp.hasAccessTokenAsync())) {
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

      const sandbox = await mp.isSandboxTokenAsync();
      return {
        ok: true as const,
        preferenceId: pref.id,
        initPoint: sandbox ? (pref.sandbox_init_point ?? pref.init_point) : pref.init_point,
        sandbox,
      };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      };
    }
  });

/** Consulta o status real da cobrança no Mercado Pago (fallback ao Realtime). */
export const getChargeStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ saleCode: z.string().min(1).max(64) }).parse(data))
  .handler(async ({ data }) => {
    const mp = await import("./mercadopago.server");
    if (!(await mp.hasAccessTokenAsync())) return { status: "pendente" as const, found: false };

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
  const publicKey = await mp.getPublicKeyAsync();
  const baseUrl = resolveBaseUrl(getRequest().url);
  return {
    accessTokenConfigured: await mp.hasAccessTokenAsync(),
    publicKeyConfigured: Boolean(publicKey),
    publicKeyPreview: publicKey ? mp.maskSecret(publicKey) : "",
    sandbox: await mp.isSandboxTokenAsync(),
    webhookUrl: `${baseUrl.replace(/\/$/, "")}/api/public/webhooks/mercadopago`,
    databaseConfigured: Boolean(
      process.env["SUPABASE_SERVICE_ROLE_KEY"] && process.env["SUPABASE_URL"],
    ),
    canEditKeys: Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"] && process.env["SUPABASE_URL"]),
  };
});

const updateSettingsInput = z.object({
  isAdmin: z.boolean(),
  accessToken: z.string().max(500).optional(),
  publicKey: z.string().max(500).optional(),
});

/**
 * Atualiza Access Token e/ou Public Key do Mercado Pago sem precisar redeploy.
 * O valor fica salvo no banco (tabela configuracoes_pagamento) e passa a ter
 * prioridade sobre a variável de ambiente. Enviar string vazia remove o override
 * e volta a usar a variável de ambiente.
 *
 * IMPORTANTE: `isAdmin` aqui é apenas um sinal vindo do cliente — este projeto não
 * usa Supabase Auth para autenticação de sessão, então esta função confia na mesma
 * checagem de papel que já protege o restante da tela de Configurações no front-end.
 * Se isso precisar ser à prova de manipulação de request, é necessário adicionar
 * autenticação de sessão real (Supabase Auth) e validar o papel no servidor.
 */
export const updatePaymentSettings = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateSettingsInput.parse(data))
  .handler(async ({ data }) => {
    if (!data.isAdmin) {
      return { ok: false as const, error: "Apenas administradores podem editar as chaves." };
    }
    const mp = await import("./mercadopago.server");
    const results: string[] = [];

    if (data.accessToken !== undefined) {
      const r = await mp.setPaymentOverride("mercadopago_access_token", data.accessToken);
      if (!r.ok) return { ok: false as const, error: r.error ?? "Falha ao salvar Access Token." };
      results.push("accessToken");
    }
    if (data.publicKey !== undefined) {
      const r = await mp.setPaymentOverride("mercadopago_public_key", data.publicKey);
      if (!r.ok) return { ok: false as const, error: r.error ?? "Falha ao salvar Public Key." };
      results.push("publicKey");
    }

    return { ok: true as const, updated: results };
  });
