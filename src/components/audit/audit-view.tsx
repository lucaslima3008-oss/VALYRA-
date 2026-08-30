import React, { useState, useMemo } from "react";
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Sliders,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime, type AuditEntry } from "@/lib/audit";

interface AuditViewProps {
  entries: AuditEntry[];
}

export function AuditView({ entries }: AuditViewProps) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"todos" | "preco" | "parametro">("todos");

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [entries]);

  const filtered = useMemo(() => {
    return sorted.filter((e) => {
      const matchQuery =
        e.field.toLowerCase().includes(query.toLowerCase()) ||
        e.user.toLowerCase().includes(query.toLowerCase()) ||
        (e.reason && e.reason.toLowerCase().includes(query.toLowerCase())) ||
        e.before.toLowerCase().includes(query.toLowerCase()) ||
        e.after.toLowerCase().includes(query.toLowerCase());

      const matchKind = kindFilter === "todos" || e.kind === kindFilter;
      return matchQuery && matchKind;
    });
  }, [sorted, query, kindFilter]);

  const stats = useMemo(() => {
    const total = entries.length;
    const priceChanges = entries.filter((e) => e.kind === "preco").length;
    const paramChanges = entries.filter((e) => e.kind === "parametro").length;
    const distinctUsers = new Set(entries.map((e) => e.user)).size;

    return { total, priceChanges, paramChanges, distinctUsers };
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Auditoria Geral do Sistema
        </h2>
        <p className="text-sm text-slate-500">
          Rastreabilidade completa de todas as alterações de preços, taxas, margens e parâmetros.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500">
            <History className="size-4 text-indigo-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Registros</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.total}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-indigo-500">
            <TrendingUp className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Ajustes de Preço</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {stats.priceChanges}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-cyan-500">
            <Sliders className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Ajustes de Custos/Taxas</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
            {stats.paramChanges}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-emerald-500">
            <ShieldCheck className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Usuários Ativos</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats.distinctUsers}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full flex-1 sm:min-w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9 bg-white dark:bg-slate-900"
            placeholder="Buscar por usuário, campo alterado, valor ou motivo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="inline-flex w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900 sm:w-auto">
          <button
            onClick={() => setKindFilter("todos")}
            className={cn(
              "min-h-9 flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:flex-none",
              kindFilter === "todos"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
            )}
          >
            Todos ({entries.length})
          </button>
          <button
            onClick={() => setKindFilter("preco")}
            className={cn(
              "min-h-9 flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:flex-none",
              kindFilter === "preco"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
            )}
          >
            Preços
          </button>
          <button
            onClick={() => setKindFilter("parametro")}
            className={cn(
              "min-h-9 flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:flex-none",
              kindFilter === "parametro"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
            )}
          >
            Parâmetros &amp; Custos
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Data / Hora</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Campo &amp; Produto</th>
              <th className="px-4 py-3">De (Anterior) &rarr; Para (Novo)</th>
              <th className="px-4 py-3">Motivo Informado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Nenhum registro de auditoria encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  className="hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-800/50 align-top"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 tabular-nums">
                    {formatDateTime(e.at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    {e.user}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                        e.kind === "preco"
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
                      )}
                    >
                      {e.kind === "preco" ? "Preço" : "Parâmetro"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {e.field}
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 line-through text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                        {e.before}
                      </span>
                      <ArrowRight className="size-3 text-slate-400" />
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        {e.after}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {e.reason || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
