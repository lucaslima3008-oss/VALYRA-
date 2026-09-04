import { useEffect, useMemo, useState } from "react";
import { FileText, Download, Building2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  fetchCompanyProfile,
  loadCompanyLogoDataUrl,
  type CompanyProfile,
} from "@/lib/company";
import { exportReportPdf, type ReportDefinition } from "@/lib/reports";
import {
  brl,
  pct,
  finalPrice,
  totalCost,
  realizedMarginPct,
  type Product,
} from "@/lib/pricing";
import type { InventoryItem } from "@/lib/inventory";
import type { CashTransaction, Sale } from "@/lib/sales";
import { paymentStatusLabel } from "@/lib/sales";

type ReportKey = "vendas" | "estoque" | "precificacao" | "fluxo_caixa";

const reportMeta: Record<ReportKey, { label: string; description: string; periodic: boolean }> = {
  vendas: {
    label: "Vendas",
    description: "Pedidos do período com forma de pagamento, receita líquida e lucro.",
    periodic: true,
  },
  estoque: {
    label: "Estoque",
    description: "Posição atual de itens, saldos mínimos e valor imobilizado.",
    periodic: false,
  },
  precificacao: {
    label: "Precificação / Margem",
    description: "Custo total, preço final e margem realizada por produto.",
    periodic: false,
  },
  fluxo_caixa: {
    label: "Fluxo de Caixa",
    description: "Entradas, saídas e saldo do período selecionado.",
    periodic: true,
  },
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR");

interface ReportsViewProps {
  products: Product[];
  inventory: InventoryItem[];
  sales: Sale[];
  transactions: CashTransaction[];
}

export function ReportsView({ products, inventory, sales, transactions }: ReportsViewProps) {
  const [active, setActive] = useState<ReportKey>("vendas");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [loadingBranding, setLoadingBranding] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoadingBranding(true);
      const profile = await fetchCompanyProfile();
      setCompany(profile);
      if (profile?.logoPath) setLogoDataUrl(await loadCompanyLogoDataUrl(profile.logoPath));
      setLoadingBranding(false);
    })();
  }, []);

  const inPeriod = (iso: string) => {
    const d = new Date(iso).getTime();
    if (from && d < new Date(`${from}T00:00:00`).getTime()) return false;
    if (to && d > new Date(`${to}T23:59:59`).getTime()) return false;
    return true;
  };

  const periodLabel = useMemo(() => {
    if (!from && !to) return "Período: todos os registros";
    const a = from ? new Date(`${from}T00:00:00`).toLocaleDateString("pt-BR") : "início";
    const b = to ? new Date(`${to}T00:00:00`).toLocaleDateString("pt-BR") : "hoje";
    return `Período: ${a} a ${b}`;
  }, [from, to]);

  const definition = useMemo<ReportDefinition>(() => {
    if (active === "vendas") {
      const rows = sales.filter((s) => inPeriod(s.date));
      const total = rows.reduce((s, x) => s + x.total, 0);
      const net = rows.reduce((s, x) => s + x.netRevenue, 0);
      const profit = rows.reduce((s, x) => s + x.grossProfit, 0);
      return {
        title: "Relatório de Vendas",
        subtitle: periodLabel,
        fileName: "relatorio-vendas",
        columns: ["Código", "Data", "Itens", "Total", "Pagamento", "Status", "Receita líquida", "Lucro bruto", "Margem"],
        rows: rows.map((s) => [
          s.code,
          fmtDateTime(s.date),
          String(s.items.reduce((n, i) => n + i.quantity, 0)),
          brl(s.total),
          s.paymentMethod.replace("_", " "),
          s.paymentStatus ? paymentStatusLabel[s.paymentStatus] : "Concluída",
          brl(s.netRevenue),
          brl(s.grossProfit),
          pct(s.marginRealizedPct),
        ]),
        summary: [
          { label: "Vendas", value: String(rows.length) },
          { label: "Faturamento", value: brl(total) },
          { label: "Receita líquida", value: brl(net) },
          { label: "Lucro bruto", value: brl(profit) },
        ],
      };
    }

    if (active === "estoque") {
      const rows = inventory;
      const value = rows.reduce((s, i) => s + i.currentStock * i.unitCost, 0);
      const low = rows.filter((i) => i.currentStock <= i.minStock).length;
      return {
        title: "Relatório de Estoque",
        subtitle: `Posição em ${new Date().toLocaleDateString("pt-BR")}`,
        fileName: "relatorio-estoque",
        columns: ["Item", "Tipo", "Saldo", "Mínimo", "Unidade", "Custo unitário", "Valor em estoque", "Atualizado em"],
        rows: rows.map((i) => [
          i.name,
          i.type === "produto_final" ? "Produto final" : "Insumo",
          String(i.currentStock),
          String(i.minStock),
          i.unit,
          brl(i.unitCost),
          brl(i.currentStock * i.unitCost),
          fmtDate(i.lastUpdated),
        ]),
        summary: [
          { label: "Itens cadastrados", value: String(rows.length) },
          { label: "Abaixo do mínimo", value: String(low) },
          { label: "Valor imobilizado", value: brl(value) },
        ],
      };
    }

    if (active === "precificacao") {
      const rows = products;
      const avg = rows.length
        ? rows.reduce((s, p) => s + realizedMarginPct(p), 0) / rows.length
        : 0;
      const ticket = rows.length ? rows.reduce((s, p) => s + finalPrice(p), 0) / rows.length : 0;
      return {
        title: "Relatório de Precificação e Margens",
        subtitle: `Portfólio em ${new Date().toLocaleDateString("pt-BR")}`,
        fileName: "relatorio-precificacao",
        columns: ["Produto", "Tipo", "Custo total", "Margem alvo", "Taxa cartão", "Logística", "Preço final", "Margem realizada"],
        rows: rows.map((p) => [
          p.name,
          p.type === "fabricado" ? "Fabricado" : "Revenda",
          brl(totalCost(p)),
          pct(p.marginPct),
          pct(p.cardFeePct),
          brl(p.logisticsCost),
          brl(finalPrice(p)),
          pct(realizedMarginPct(p)),
        ]),
        summary: [
          { label: "Produtos", value: String(rows.length) },
          { label: "Margem média", value: pct(avg) },
          { label: "Ticket médio", value: brl(ticket) },
        ],
      };
    }

    const rows = transactions.filter((t) => inPeriod(t.date));
    const inflow = rows.filter((t) => t.type === "entrada").reduce((s, t) => s + t.amount, 0);
    const outflow = rows.filter((t) => t.type === "saida").reduce((s, t) => s + t.amount, 0);
    return {
      title: "Relatório de Fluxo de Caixa",
      subtitle: periodLabel,
      fileName: "relatorio-fluxo-de-caixa",
      columns: ["Data", "Tipo", "Categoria", "Descrição", "Valor", "Usuário"],
      rows: rows.map((t) => [
        fmtDateTime(t.date),
        t.type === "entrada" ? "Entrada" : "Saída",
        t.category,
        t.description,
        `${t.type === "saida" ? "-" : ""}${brl(t.amount)}`,
        t.user,
      ]),
      summary: [
        { label: "Lançamentos", value: String(rows.length) },
        { label: "Entradas", value: brl(inflow) },
        { label: "Saídas", value: brl(outflow) },
        { label: "Saldo", value: brl(inflow - outflow) },
      ],
    };
  }, [active, from, to, periodLabel, products, inventory, sales, transactions]);

  const showPeriod = reportMeta[active].periodic;
  const hasCompany = Boolean(company?.name);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Relatórios
        </h2>
        <p className="text-sm text-slate-500">
          Exporte documentos em PDF com a identidade da sua empresa (logo no cabeçalho, dados de
          contato no rodapé).
        </p>
      </div>

      {!loadingBranding && !hasCompany && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Nenhum dado de empresa cadastrado ainda — os PDFs serão gerados normalmente, apenas sem
          logo e sem dados no rodapé. Preencha em <strong>Configurações → Dados da Empresa</strong>.
        </div>
      )}

      {hasCompany && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="" className="size-8 object-contain" />
          ) : (
            <Building2 className="size-4 text-[#D4AF37]" />
          )}
          Documentos emitidos como <strong>{company?.name}</strong>
        </div>
      )}

      {/* Seleção do relatório */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(reportMeta) as ReportKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              active === key
                ? "border-[#D4AF37] bg-[#D4AF37]/10 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900",
            )}
          >
            <div className="flex items-center gap-2">
              <FileText
                className={cn("size-4", active === key ? "text-[#D4AF37]" : "text-slate-400")}
              />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {reportMeta[key].label}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{reportMeta[key].description}</p>
          </button>
        ))}
      </div>

      {/* Filtros e exportação */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-end sm:justify-between">
        {showPeriod ? (
          <div className="grid w-full gap-3 sm:max-w-md sm:grid-cols-2">
            <div>
              <Label className="text-xs text-slate-500">De</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Até</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Este relatório reflete a posição atual, sem filtro de período.
          </p>
        )}

        <Button
          className="w-full gap-2 sm:w-auto"
          disabled={loadingBranding}
          onClick={() => exportReportPdf(definition, { company, logoDataUrl })}
        >
          {loadingBranding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Exportar PDF
        </Button>
      </div>

      {/* Prévia dos dados */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {definition.title}
          </p>
          <span className="text-xs text-slate-500">{definition.rows.length} registro(s)</span>
        </div>

        {definition.summary && (
          <div className="grid gap-3 border-b border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-2 xl:grid-cols-4">
            {definition.summary.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {s.label}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/60">
              <tr>
                {definition.columns.map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {definition.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={definition.columns.length}
                    className="px-3 py-8 text-center text-xs text-slate-400"
                  >
                    Nenhum registro no período selecionado.
                  </td>
                </tr>
              ) : (
                definition.rows.slice(0, 25).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="whitespace-nowrap px-3 py-2 text-slate-700 dark:text-slate-300"
                      >
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {definition.rows.length > 25 && (
          <p className="border-t border-slate-100 p-3 text-xs text-slate-500 dark:border-slate-800">
            Mostrando os 25 primeiros registros na tela — o PDF exportado inclui todos os{" "}
            {definition.rows.length}.
          </p>
        )}
      </div>
    </div>
  );
}
