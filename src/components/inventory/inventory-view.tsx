import React, { useState, useMemo } from "react";
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Package,
  History,
  Search,
  SlidersHorizontal,
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
import type { InventoryItem, StockMovement, MovementType, StockItemType } from "@/lib/inventory";
import { uid } from "@/lib/pricing";

interface InventoryViewProps {
  inventory: InventoryItem[];
  movements: StockMovement[];
  canManage: boolean;
  currentUserName: string;
  onUpdateStock: (
    itemId: string,
    delta: number,
    type: MovementType,
    reason: string,
    user: string,
    supplierCost?: number,
    freightCost?: number,
  ) => void;
}

export function InventoryView({
  inventory,
  movements,
  canManage,
  currentUserName,
  onUpdateStock,
}: InventoryViewProps) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"todos" | StockItemType>("todos");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Movement Form state
  const [movType, setMovType] = useState<MovementType>("entrada");
  const [movQuantity, setMovQuantity] = useState("1");
  const [movReason, setMovReason] = useState("");
  const [movSupplierCost, setMovSupplierCost] = useState("");
  const [movFreightCost, setMovFreightCost] = useState("");



  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchQuery = item.name.toLowerCase().includes(query.toLowerCase());
      const matchType = filterType === "todos" || item.type === filterType;
      return matchQuery && matchType;
    });
  }, [inventory, query, filterType]);

  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce(
      (acc, item) => acc + item.currentStock * item.unitCost,
      0,
    );
    const lowStockItems = inventory.filter((i) => i.currentStock <= i.minStock).length;
    const criticalStockItems = inventory.filter((i) => i.currentStock <= 0).length;

    return { totalItems, totalValue, lowStockItems, criticalStockItems };
  }, [inventory]);

  const handleOpenMovement = (item: InventoryItem) => {
    setSelectedItem(item);
    setMovType("entrada");
    setMovQuantity("1");
    setMovReason("");
    setMovSupplierCost("");
    setMovFreightCost("");
    setMovementModalOpen(true);
  };

  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const qty = parseFloat(movQuantity) || 0;
    if (qty <= 0) return;

    const supplierCost = movType === "entrada" ? (parseFloat(movSupplierCost) || undefined) : undefined;
    const freightCost = movType === "entrada" ? (parseFloat(movFreightCost) || undefined) : undefined;

    onUpdateStock(
      selectedItem.id,
      qty,
      movType,
      movReason || `Ajuste manual (${movType})`,
      currentUserName,
      supplierCost,
      freightCost,
    );
    setMovementModalOpen(false);
  };



  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Controle de Estoque &amp; Insumos
          </h2>
          <p className="text-sm text-slate-500">
            Gestão de saldos físicos, baixas automáticas de vendas e histórico de movimentações.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setHistoryModalOpen(true)}
            className="gap-2 border-slate-300 dark:border-slate-700"
          >
            <History className="size-4 text-slate-500" />
            Histórico de Movimentações
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500">
            <Boxes className="size-4 text-indigo-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Itens em Estoque</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.totalItems}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500">
            <Package className="size-4 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Valor Imobilizado</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {brl(stats.totalValue)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Abaixo do Mínimo</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {stats.lowStockItems} itens
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Estoque Esgotado</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {stats.criticalStockItems} itens
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full flex-1 sm:min-w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9 bg-white dark:bg-slate-900"
            placeholder="Buscar por nome do produto ou insumo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="inline-flex w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900 sm:w-auto">
          <button
            onClick={() => setFilterType("todos")}
            className={cn(
              "min-h-9 flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:flex-none",
              filterType === "todos"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
            )}
          >
            Todos ({inventory.length})
          </button>
          <button
            onClick={() => setFilterType("produto_final")}
            className={cn(
              "min-h-9 flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:flex-none",
              filterType === "produto_final"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
            )}
          >
            Produtos Finais
          </button>
          <button
            onClick={() => setFilterType("insumo")}
            className={cn(
              "min-h-9 flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:flex-none",
              filterType === "insumo"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
            )}
          >
            Insumos &amp; Matéria-Prima
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Item / Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Saldo Atual</th>
              <th className="px-4 py-3 text-right">Estoque Mínimo</th>
              <th className="px-4 py-3 text-right">Custo Médio</th>
              <th className="px-4 py-3 text-right">Total em Estoque</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  Nenhum item de estoque encontrado.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minStock && item.currentStock > 0;
                const isZero = item.currentStock <= 0;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          item.type === "produto_final"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
                        )}
                      >
                        {item.type === "produto_final" ? "Produto Final" : "Insumo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                      {item.currentStock} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {brl(item.unitCost)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900 dark:text-white">
                      {brl(item.currentStock * item.unitCost)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isZero ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          <AlertTriangle className="size-3" /> Esgotado
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          <AlertTriangle className="size-3" /> Baixo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="size-3" /> Regular
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenMovement(item)}
                        className="h-8 text-xs gap-1"
                      >
                        <SlidersHorizontal className="size-3.5" />
                        Movimentar
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Movimentação */}
      <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lançar Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              {selectedItem ? `Item selecionado: ${selectedItem.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmMovement} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de Movimentação</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setMovType("entrada")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition-all",
                    movType === "entrada"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "border-slate-200 text-slate-600 dark:border-slate-800",
                  )}
                >
                  <ArrowUpRight className="size-4 text-emerald-500" />
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setMovType("saida")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition-all",
                    movType === "saida"
                      ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                      : "border-slate-200 text-slate-600 dark:border-slate-800",
                  )}
                >
                  <ArrowDownRight className="size-4 text-rose-500" />
                  Saída
                </button>
                <button
                  type="button"
                  onClick={() => setMovType("ajuste")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition-all",
                    movType === "ajuste"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "border-slate-200 text-slate-600 dark:border-slate-800",
                  )}
                >
                  <SlidersHorizontal className="size-4 text-indigo-500" />
                  Ajuste
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Quantidade ({selectedItem?.unit || "un"})</Label>
              <Input
                type="number"
                step="any"
                min="0.01"
                required
                value={movQuantity}
                onChange={(e) => setMovQuantity(e.target.value)}
              />
            </div>

            {movType === "entrada" && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Custos de Aquisição do Lote</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Preço Pago ao Fornecedor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={movSupplierCost}
                      onChange={(e) => setMovSupplierCost(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Frete e Despesas (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={movFreightCost}
                      onChange={(e) => setMovFreightCost(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Motivo / Observação</Label>
              <Input
                placeholder="Ex: Recebimento de compra, avaria, recontagem..."
                value={movReason}
                onChange={(e) => setMovReason(e.target.value)}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMovementModalOpen(false)}
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

      {/* Modal de Histórico de Movimentações */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Movimentações de Estoque</DialogTitle>
            <DialogDescription>
              Registro de todas as entradas, saídas manuais e baixas por vendas no PDV.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 dark:bg-slate-950 dark:border-slate-800">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Data/Hora</th>
                  <th className="px-3 py-2.5">Item</th>
                  <th className="px-3 py-2.5">Tipo</th>
                  <th className="px-3 py-2.5 text-right">Qtd</th>
                  <th className="px-3 py-2.5 text-right">Saldo Final</th>
                  <th className="px-3 py-2.5">Motivo</th>
                  <th className="px-3 py-2.5">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.map((mov) => (
                  <tr key={mov.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500 tabular-nums">
                      {formatDateTime(mov.date)}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                      {mov.itemName}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          mov.type === "entrada"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : mov.type === "venda"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
                        )}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                      {mov.type === "entrada" ? "+" : "-"}
                      {mov.quantity}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                      {mov.balanceAfter}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      {mov.reason}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{mov.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
