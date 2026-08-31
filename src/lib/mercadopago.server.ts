// Helpers server-only para integração com o Mercado Pago (Checkout Pro).
// Este arquivo NUNCA é enviado ao bundle do navegador (extensão *.server.ts).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const MP_API = "https://api.mercadopago.com";

/** Cliente com service role para escrita a partir do webhook (bypassa RLS). */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Cache em memória (curta duração) para não bater no banco a cada requisição.
let overridesCache: { accessToken?: string; publicKey?: string } | null = null;
let overridesCacheAt = 0;
const OVERRIDES_TTL_MS = 30_000;

async function loadOverrides(): Promise<{ accessToken?: string; publicKey?: string }> {
  if (overridesCache && Date.now() - overridesCacheAt < OVERRIDES_TTL_MS) return overridesCache;

  const db = getServiceClient();
  if (!db) {
    overridesCache = {};
    overridesCacheAt = Date.now();
    return overridesCache;
  }

  try {
    const { data } = await db
      .from("configuracoes_pagamento")
      .select("chave, valor")
      .in("chave", ["mercadopago_access_token", "mercadopago_public_key"]);

    const result: { accessToken?: string; publicKey?: string } = {};
    for (const row of data ?? []) {
      if (row["chave"] === "mercadopago_access_token" && row["valor"])
        result.accessToken = row["valor"];
      if (row["chave"] === "mercadopago_public_key" && row["valor"])
        result.publicKey = row["valor"];
    }
    overridesCache = result;
    overridesCacheAt = Date.now();
    return result;
  } catch (err) {
    console.error("Erro ao carregar overrides de pagamento:", err);
    overridesCache = {};
    overridesCacheAt = Date.now();
    return overridesCache;
  }
}

/** Salva (ou remove, se valor vazio) uma chave editável de pagamento no banco. */
export async function setPaymentOverride(
  key: "mercadopago_access_token" | "mercadopago_public_key",
  value: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getServiceClient();
  if (!db) {
    return {
      ok: false,
      error:
        "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configurados para editar chaves por aqui.",
    };
  }

  try {
    if (value.trim()) {
      const { error } = await db
        .from("configuracoes_pagamento")
        .upsert({ chave: key, valor: value.trim(), updated_at: new Date().toISOString() });
      if (error) return { ok: false, error: error.message };
    } else {
      await db.from("configuracoes_pagamento").delete().eq("chave", key);
    }
    overridesCache = null; // força recarregar no próximo uso
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

/** Devolve um preview mascarado (nunca a chave completa) para exibir na UI. */
export function maskSecret(value: string): string {
  if (value.length <= 12) return "••••••••";
  return `${value.slice(0, 8)}••••${value.slice(-4)}`;
}

export async function getAccessTokenAsync(): Promise<string> {
  const overrides = await loadOverrides();
  const token = overrides.accessToken || process.env["MERCADOPAGO_ACCESS_TOKEN"];
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return token;
}

export async function hasAccessTokenAsync(): Promise<boolean> {
  const overrides = await loadOverrides();
  return Boolean(overrides.accessToken || process.env["MERCADOPAGO_ACCESS_TOKEN"]);
}

export async function isSandboxTokenAsync(): Promise<boolean> {
  const overrides = await loadOverrides();
  const token = overrides.accessToken || process.env["MERCADOPAGO_ACCESS_TOKEN"] || "";
  return token.startsWith("TEST-");
}

export async function getPublicKeyAsync(): Promise<string> {
  const overrides = await loadOverrides();
  return overrides.publicKey || process.env["MERCADOPAGO_PUBLIC_KEY"] || "";
}

/** @deprecated use getAccessTokenAsync — mantido apenas onde a chamada não pode ser assíncrona. */
export function getAccessToken(): string {
  const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return token;
}

export function hasAccessToken(): boolean {
  return Boolean(process.env["MERCADOPAGO_ACCESS_TOKEN"]);
}

export function isSandboxToken(): boolean {
  return (process.env["MERCADOPAGO_ACCESS_TOKEN"] || "").startsWith("TEST-");
}

export interface MpPreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
}

export async function createPreference(params: {
  items: MpPreferenceItem[];
  externalReference: string;
  notificationUrl: string;
  backUrl?: string;
}): Promise<{ id: string; init_point: string; sandbox_init_point?: string }> {
  const baseUrl = params.backUrl?.replace(/\/$/, "");
  const backUrls = baseUrl
    ? { success: `${baseUrl}/`, pending: `${baseUrl}/`, failure: `${baseUrl}/` }
    : undefined;

  const body: Record<string, unknown> = {
    items: params.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      unit_price: Number(i.unit_price.toFixed(2)),
      currency_id: "BRL",
    })),
    external_reference: params.externalReference,
    notification_url: params.notificationUrl,
  };

  if (backUrls) {
    body["back_urls"] = backUrls;
    body["auto_return"] = "approved";
  }

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getAccessTokenAsync()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      `Mercado Pago (${res.status}): ${String(json["message"] ?? "falha ao criar preferência")}`,
    );
  }
  return json as unknown as { id: string; init_point: string; sandbox_init_point?: string };
}

export interface MpPayment {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
}

export async function getPayment(paymentId: string): Promise<MpPayment | null> {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${await getAccessTokenAsync()}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as MpPayment;
}

export async function searchPaymentsByReference(reference: string): Promise<MpPayment[]> {
  const res = await fetch(
    `${MP_API}/v1/payments/search?external_reference=${encodeURIComponent(reference)}&sort=date_created&criteria=desc`,
    { headers: { Authorization: `Bearer ${await getAccessTokenAsync()}` } },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: MpPayment[] };
  return json.results ?? [];
}

/** Traduz o status do Mercado Pago para o status usado no sistema. */
export function mapStatus(mpStatus: string): "pendente" | "pago" | "expirado" | "cancelado" {
  switch (mpStatus) {
    case "approved":
      return "pago";
    case "rejected":
    case "cancelled":
      return "cancelado";
    case "refunded":
    case "charged_back":
      return "cancelado";
    case "expired":
      return "expirado";
    default:
      return "pendente";
  }
}

/**
 * Aplica no banco o resultado de um pagamento: atualiza a venda e,
 * quando aprovado, dá baixa no estoque e lança a entrada no fluxo de caixa.
 */
export async function applyPaymentToSale(
  externalReference: string,
  status: "pendente" | "pago" | "expirado" | "cancelado",
  paymentId?: string,
): Promise<{ applied: boolean; reason?: string }> {
  const db = getServiceClient();
  if (!db) return { applied: false, reason: "Supabase server não configurado" };

  const { data: sale } = await db
    .from("vendas")
    .select("*")
    .eq("codigo", externalReference)
    .maybeSingle();

  if (!sale) return { applied: false, reason: "Venda não encontrada" };
  if (sale["status_pagamento"] === "pago" && status === "pago") {
    return { applied: false, reason: "Pagamento já processado" };
  }

  await db
    .from("vendas")
    .update({
      status_pagamento: status,
      mp_payment_id: paymentId ?? null,
    })
    .eq("id", sale["id"]);

  if (status !== "pago") return { applied: true };

  // Baixa automática de estoque
  const { data: items } = await db.from("itens_venda").select("*").eq("venda_id", sale["id"]);
  for (const item of items ?? []) {
    const { data: stock } = await db
      .from("estoque")
      .select("*")
      .eq("nome", item["nome"])
      .maybeSingle();
    if (!stock) continue;

    const nextBalance = Math.max(0, Number(stock["saldo_atual"]) - Number(item["quantidade"]));
    await db
      .from("estoque")
      .update({ saldo_atual: nextBalance, updated_at: new Date().toISOString() })
      .eq("id", stock["id"]);

    await db.from("movimentacoes_estoque").insert({
      item_id: stock["id"],
      item_nome: stock["nome"],
      tipo: "venda",
      quantidade: Number(item["quantidade"]),
      saldo_apos: nextBalance,
      motivo: `Baixa automática — pagamento aprovado (${externalReference})`,
      usuario: "Mercado Pago (webhook)",
    });
  }

  // Entrada no fluxo de caixa
  await db.from("fluxo_caixa").insert({
    tipo: "entrada",
    categoria: "Venda PDV (Mercado Pago)",
    descricao: `Cobrança ${externalReference} aprovada`,
    valor: Number(sale["receita_liquida"] ?? sale["total"]),
    usuario: "Mercado Pago (webhook)",
    venda_id: sale["id"],
  });

  return { applied: true };
}
