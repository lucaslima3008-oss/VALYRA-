import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { brl } from "@/lib/pricing";
import { formatDateTime } from "@/lib/audit";
import type { CashTransaction, TransactionType } from "@/lib/sales";
import { uid } from "@/lib/pricing";

interface CashflowViewProps {
  transactions: CashTransaction[];
  canManage: boolean;
  currentUserName: string;
  onAddTransaction: (tx: CashTransaction) => void;
}

export function CashflowView({
  transactions,
  canManage,
  currentUserName,
  onAddTransaction,
}: CashflowViewProps) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"todos" | TransactionType>("todos");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Transaction form
  const [txType, setTxType] = useState<TransactionType>("saida");
  const [txCategory, setTxCategory] = useState("Despesas Operacionais");
  const [txDescription, setTxDescription] = useState("");
  const [txAmount, setTxAmount] = useState("");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchQuery =
        tx.description.toLowerCase().includes(query.toLowerCase()) ||
        tx.category.toLowerCase().includes(query.toLowerCase());
      const matchType = filterType === "todos" || tx.type === filterType;
      return matchQuery && matchType;
    });
  }, [transactions, query, filterType]);

  const summary = useMemo(() => {
    const totalInflow = transactions
      .filter((t) => t.type === "entrada")
      .reduce((s, t) => s + t.amount, 0);

    const totalOutflow = transactions
      .filter((t) => t.type === "saida")
      .reduce((s, t) => s + t.amount, 0);

    const netBalance = totalInflow - totalOutflow;

    return { totalInflow, totalOutflow, netBalance };
  }, [transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount) || 0;
    if (amountNum <= 0 || !txDescription.trim()) return;

    const newTx: CashTransaction = {
      id: uid(),
      type: txType,
      category: txCategory,
      description: txDescription.trim(),
      amount: amountNum,
      date: new Date().toISOString(),
      user: currentUserName,
    };

    onAddTransaction(newTx);
    setCreateModalOpen(false);
    setTxDescription("");
    setTxAmount("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Fluxo de Caixa &amp; Movimentação Financeira
          </h2>
          <p className="text-sm text-slate-500">
            Controle de receitas provenientes do PDV, deduções de custos e lançamentos avulsos.
          </p>
        </div>

        <Button
          disabled={!canManage}
          onClick={() => setCreateModalOpen(true)}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="size-4" />
          Novo Lançamento
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Entradas (Receitas)</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
              <ArrowUpRight className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{brl(summary.totalInflow)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Saídas (Despesas)</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950">
              <ArrowDownRight className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            -{brl(summary.totalOutflow)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Líquido</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950">
              <Wallet className="size-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p
            className={cn(
              "mt-2 text-2xl font-extrabold tabular-nums",
              summary.netBalance >= 0
                ? "text-slate-900 dark:text-white"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {brl(summary.netBalance)}
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-72 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9 bg-white dark:bg-slate-900"
            placeholder="Buscar por descrição ou categoria..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setFilterType("todos")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              filterType === "todos"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
            )}
          >
            Todos ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType("entrada")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              filterType === "entrada"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
            )}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilterType("saida")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              filterType === "saida"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
            )}
          >
            Saídas
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Data / Hora</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3">Responsável</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isEntry = tx.type === "entrada";

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 tabular-nums">
                      {formatDateTime(tx.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          isEntry
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
                        )}
                      >
                        {isEntry ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {tx.category}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white">
                      {tx.description}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-bold tabular-nums",
                        isEntry
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {isEntry ? "+" : "-"}
                      {brl(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{tx.user}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Lançamento */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lançamento no Fluxo de Caixa</DialogTitle>
            <DialogDescription>
              Registre uma despesa operacional, retirada ou aporte financeiro.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de Transação</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType("saida")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition-all",
                    txType === "saida"
                      ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                      : "border-slate-200 text-slate-600 dark:border-slate-800",
                  )}
                >
                  <ArrowDownRight className="size-4 text-rose-500" />
                  Saída / Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("entrada")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition-all",
                    txType === "entrada"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "border-slate-200 text-slate-600 dark:border-slate-800",
                  )}
                >
                  <ArrowUpRight className="size-4 text-emerald-500" />
                  Entrada / Aporte
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="Despesas Operacionais">Despesas Operacionais</option>
                <option value="Insumos & Matéria-Prima">Insumos &amp; Matéria-Prima</option>
                <option value="Logística e Fretes">Logística e Fretes</option>
                <option value="Marketing & Vendas">Marketing &amp; Vendas</option>
                <option value="Aporte de Capital">Aporte de Capital</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição / Motivo</Label>
              <Input
                required
                placeholder="Ex: Compra de embalagens urgentes, pagamento de frete..."
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700">
                Confirmar Lançamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
