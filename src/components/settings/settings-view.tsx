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
  Pencil,
  Save,
  X as XIcon,
  Plus,
  Trash2,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMercadoPagoConfig, updatePaymentSettings } from "@/lib/mercadopago.functions";
import { uid } from "@/lib/pricing";
import type { CardMachine } from "@/lib/card-machines";
import { fetchCardMachines, saveCardMachine, deleteCardMachine } from "@/lib/supabase-service";

interface MpConfig {
  accessTokenConfigured: boolean;
  publicKeyConfigured: boolean;
  publicKeyPreview: string;
  sandbox: boolean;
  webhookUrl: string;
  databaseConfigured: boolean;
  canEditKeys: boolean;
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

function KeyEditor({
  label,
  placeholder,
  currentHint,
  onSave,
}: {
  label: string;
  placeholder: string;
  currentHint: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = () => {
    setEditing(false);
    setValue("");
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(value);
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{currentHint}</p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => setEditing(true)}
        >
          <Pencil className="size-3.5" />
          Editar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-slate-500">{label}</Label>
      <Input
        type="password"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="font-mono text-xs"
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Salvar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 px-2 text-xs"
          disabled={saving}
          onClick={cancel}
        >
          <XIcon className="size-3.5" />
          Cancelar
        </Button>
        <span className="text-[11px] text-slate-400">
          Deixe em branco e salve para remover o override.
        </span>
      </div>
    </div>
  );
}

function emptyMachine(): CardMachine {
  return {
    id: uid(),
    nickname: "",
    model: "",
    acquirer: "",
    serialNumber: "",
    status: "ativa",
    createdAt: new Date().toISOString(),
  };
}

function CardMachinesSection({ isAdmin }: { isAdmin: boolean }) {
  const [machines, setMachines] = useState<CardMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<CardMachine>(emptyMachine());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setMachines(await fetchCardMachines());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const startAdd = () => {
    setDraft(emptyMachine());
    setAdding(true);
  };

  const submit = async () => {
    if (!draft.nickname.trim()) return;
    setSaving(true);
    try {
      await saveCardMachine(draft);
      setMachines((prev) => [draft, ...prev]);
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (m: CardMachine) => {
    const updated: CardMachine = { ...m, status: m.status === "ativa" ? "inativa" : "ativa" };
    setMachines((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    await saveCardMachine(updated);
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta maquininha do cadastro?")) return;
    setMachines((prev) => prev.filter((m) => m.id !== id));
    await deleteCardMachine(id);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Smartphone className="size-4 text-sky-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Maquininhas de Cartão
          </h3>
        </div>
        {isAdmin && !adding && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={startAdd}>
            <Plus className="size-3.5" />
            Nova maquininha
          </Button>
        )}
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Cadastre aqui as maquininhas físicas usadas no PDV (Mercado Pago Point, Stone, PagSeguro
        etc.) para identificar qual terminal recebeu cada venda no cartão presencial.
      </p>

      {adding && (
        <div className="mb-4 grid gap-2 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-slate-500">Apelido *</Label>
            <Input
              placeholder="Ex: Caixa 1"
              value={draft.nickname}
              onChange={(e) => setDraft((d) => ({ ...d, nickname: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Adquirente</Label>
            <Input
              placeholder="Ex: Mercado Pago, Stone, PagSeguro"
              value={draft.acquirer}
              onChange={(e) => setDraft((d) => ({ ...d, acquirer: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Modelo</Label>
            <Input
              placeholder="Ex: Point Mini, Moderninha X"
              value={draft.model}
              onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Número de série</Label>
            <Input
              placeholder="Opcional"
              value={draft.serialNumber}
              onChange={(e) => setDraft((d) => ({ ...d, serialNumber: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Button
              size="sm"
              disabled={saving || !draft.nickname.trim()}
              onClick={() => void submit()}
              className="gap-1.5"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Salvar maquininha
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="size-3.5 animate-spin" /> Carregando maquininhas...
        </div>
      ) : machines.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhuma maquininha cadastrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {machines.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-2.5 dark:border-slate-800"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {m.nickname}
                  </span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] font-medium " +
                      (m.status === "ativa"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")
                    }
                  >
                    {m.status === "ativa" ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <p className="truncate text-xs text-slate-500">
                  {[m.acquirer, m.model, m.serialNumber && `S/N ${m.serialNumber}`]
                    .filter(Boolean)
                    .join(" · ") || "Sem detalhes adicionais"}
                </p>
              </div>
              {isAdmin && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => void toggleStatus(m)}
                  >
                    {m.status === "ativa" ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 hover:text-destructive"
                    onClick={() => void remove(m.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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

  const saveAccessToken = async (value: string) => {
    const res = await updatePaymentSettings({ data: { isAdmin, accessToken: value } });
    if (!res.ok) throw new Error(res.error);
    await load();
  };

  const savePublicKey = async (value: string) => {
    const res = await updatePaymentSettings({ data: { isAdmin, publicKey: value } });
    if (!res.ok) throw new Error(res.error);
    await load();
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
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                {config.accessTokenConfigured ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Access Token {config.sandbox ? "(Sandbox)" : "(Produção)"}
                  </p>
                  {config.canEditKeys ? (
                    <div className="mt-1">
                      <KeyEditor
                        label="Novo Access Token"
                        placeholder="APP_USR-... ou TEST-..."
                        currentHint={
                          config.accessTokenConfigured
                            ? "Chave privada ativa e armazenada com segurança no servidor."
                            : "Nenhuma chave configurada ainda."
                        }
                        onSave={saveAccessToken}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Para editar por aqui, configure primeiro SUPABASE_URL e
                      SUPABASE_SERVICE_ROLE_KEY. Até lá, troque via variável de ambiente
                      MERCADOPAGO_ACCESS_TOKEN.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                {config.publicKeyConfigured ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Public Key
                  </p>
                  {config.canEditKeys ? (
                    <div className="mt-1">
                      <KeyEditor
                        label="Nova Public Key"
                        placeholder="APP_USR-... ou TEST-..."
                        currentHint={
                          config.publicKeyConfigured
                            ? `Chave pública: ${config.publicKeyPreview}`
                            : "Opcional no fluxo de link de pagamento."
                        }
                        onSave={savePublicKey}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {config.publicKeyConfigured
                        ? `Chave pública: ${config.publicKeyPreview}`
                        : "Opcional no fluxo de link de pagamento (MERCADOPAGO_PUBLIC_KEY)."}
                    </p>
                  )}
                </div>
              </div>
            </div>

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
              Cadastre esta URL no painel do Mercado Pago em{" "}
              <strong>Suas integrações → Webhooks</strong>, evento <strong>Pagamentos</strong>.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
              <code className="flex-1 truncate text-xs text-slate-700 dark:text-slate-300">
                {config.webhookUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => void copyWebhook()}
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>

          <CardMachinesSection isAdmin={isAdmin} />

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
              Chaves editadas aqui têm prioridade sobre a variável de ambiente e ficam salvas de
              forma protegida no banco (sem exposição ao navegador). Deixar o campo em branco ao
              salvar remove o override e volta a usar a variável de ambiente.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
