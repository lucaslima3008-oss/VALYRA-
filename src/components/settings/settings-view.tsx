import React, { useEffect, useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMercadoPagoConfig } from "@/lib/mercadopago.functions";

interface MpConfig {
  accessTokenConfigured: boolean;
  publicKeyConfigured: boolean;
  publicKeyPreview: string;
  sandbox: boolean;
  webhookUrl: string;
  databaseConfigured: boolean;
}

function StatusRow({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
      )}
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

export function SettingsView({ isAdmin }: { isAdmin: boolean }) {
  const [config, setConfig] = useState<MpConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setConfig((await getMercadoPagoConfig()) as MpConfig);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
        Apenas administradores podem acessar as configurações de integração.
      </div>
    );
  }

  const copyWebhook = async () => {
    if (!config) return;
    await navigator.clipboard.writeText(config.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Integração de Pagamentos
          </h2>
          <p className="text-sm text-slate-500">
            Mercado Pago (Checkout Pro) — cobranças enviadas ao cliente, sem processar cartão dentro
            do sistema.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => void load()}>
          <RefreshCw className="size-4" />
          Recarregar
        </Button>
      </div>

      {loading || !config ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" /> Verificando configuração...
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <StatusRow
              ok={config.accessTokenConfigured}
              label={`Access Token ${config.sandbox ? "(Sandbox)" : "(Produção)"}`}
              hint={
                config.accessTokenConfigured
                  ? "Chave privada ativa e armazenada com segurança no servidor."
                  : "Configure o segredo MERCADOPAGO_ACCESS_TOKEN para habilitar as cobranças."
              }
            />
            <StatusRow
              ok={config.publicKeyConfigured}
              label="Public Key"
              hint={
                config.publicKeyConfigured
                  ? `Chave pública: ${config.publicKeyPreview}`
                  : "Opcional no fluxo de link de pagamento (MERCADOPAGO_PUBLIC_KEY)."
              }
            />
            <StatusRow
              ok={config.databaseConfigured}
              label="Banco de dados (webhook)"
              hint={
                config.databaseConfigured
                  ? "O webhook pode atualizar vendas, estoque e caixa automaticamente."
                  : "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para a baixa automática."
              }
            />
            <StatusRow
              ok
              label="Segurança"
              hint="As chaves ficam apenas no servidor. Nenhum dado de cartão trafega pelo app."
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="size-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                URL de notificação (webhook)
              </h3>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Cadastre esta URL no painel do Mercado Pago em <strong>Suas integrações → Webhooks</strong>,
              evento <strong>Pagamentos</strong>.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
              <code className="flex-1 truncate text-xs text-slate-700 dark:text-slate-300">
                {config.webhookUrl}
              </code>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void copyWebhook()}>
                {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <div className="mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <CreditCard className="size-4 text-sky-500" />
              <span className="text-sm font-semibold">Como funciona</span>
            </div>
            <ol className="list-decimal space-y-1 pl-4">
              <li>No PDV, monte o carrinho e clique em “Gerar Cobrança (Mercado Pago)”.</li>
              <li>Envie o link ou QR Code ao cliente (WhatsApp, e-mail ou impressão).</li>
              <li>O cliente paga no ambiente seguro do Mercado Pago.</li>
              <li>
                O webhook confirma o pagamento, marca a venda como paga, dá baixa no estoque e lança
                a entrada no fluxo de caixa.
              </li>
            </ol>
            <div className="mt-3 flex items-start gap-2 text-[11px]">
              <Database className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
              As credenciais são gerenciadas como segredos do servidor — para trocar entre sandbox e
              produção, atualize o segredo MERCADOPAGO_ACCESS_TOKEN.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
