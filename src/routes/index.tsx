import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Layers,
  TrendingUp,
  AlertTriangle,
  Calculator,
  Boxes,
  ShoppingCart,
  DollarSign,
  Users as UsersIcon,
  History,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Sidebar, type AppModule } from "@/components/layout/sidebar";
import { PricingTable } from "@/components/pricing/pricing-table";
import { ProductSheet } from "@/components/pricing/product-sheet";
import { UsersPanel } from "@/components/pricing/users-panel";
import { InventoryView } from "@/components/inventory/inventory-view";
import { PosView } from "@/components/pos/pos-view";
import { CashflowView } from "@/components/cashflow/cashflow-view";
import { AuditView } from "@/components/audit/audit-view";

import { creationEntry, diffProduct, type AuditEntry } from "@/lib/audit";
import { mockUsers, roleLabel, type AppUser } from "@/lib/users";
import {
  brl,
  mockProducts,
  pct,
  realizedMarginPct,
  finalPrice,
  uid,
  type Product,
  type ProductType,
} from "@/lib/pricing";
import {
  initialInventory,
  initialMovements,
  type InventoryItem,
  type StockMovement,
  type MovementType,
} from "@/lib/inventory";
import {
  initialSales,
  initialCashTransactions,
  type Sale,
  type CashTransaction,
} from "@/lib/sales";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cost & Price — Gestão de Portfólio, Estoque e Precificação" },
      {
        name: "description",
        content:
          "Plataforma completa B2B para precificação inteligente com divisor de markup, controle de estoque com baixas automáticas, PDV, fluxo de caixa e auditoria.",
      },
      { property: "og:title", content: "Cost & Price — Gestão de Portfólio, Estoque e Precificação" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0",
      },
    ],
  }),
  component: Index,
});

type Filter = "todos" | ProductType;

function Index() {
  // Global State
  const [activeModule, setActiveModule] = useState<AppModule>("precificacao");
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(initialCashTransactions);
  const [users, setUsers] = useState<AppUser[]>(mockUsers);
  const [currentUserId, setCurrentUserId] = useState(mockUsers[0]!.id);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([
    {
      id: "aud-init-1",
      productId: "p2",
      at: new Date(Date.now() - 3600000 * 3).toISOString(),
      user: "Ana Souza",
      kind: "preco",
      field: "Preço praticado (manual)",
      before: "R$ 57,80",
      after: "R$ 62,90",
      reason: "Alinhamento com preço de mercado",
    },
    {
      id: "aud-init-2",
      productId: "p3",
      at: new Date(Date.now() - 3600000 * 25).toISOString(),
      user: "Carlos Mendes",
      kind: "parametro",
      field: "Comissão Marketplace",
      before: "10,00%",
      after: "12,00%",
      reason: "Atualização das taxas de comissão da plataforma parceira",
    },
  ]);

  // Pricing module state
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const currentUser = users.find((u) => u.id === currentUserId) ?? users[0]!;
  const canEdit = currentUser?.role === "admin" && currentUser?.status === "ativo";

  // Low stock counter for sidebar badge
  const lowStockCount = useMemo(() => {
    return inventory.filter((i) => i.currentStock <= i.minStock).length;
  }, [inventory]);

  // Filtered products for Pricing Table
  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          (filter === "todos" || p.type === filter) &&
          p.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [products, query, filter],
  );

  // Pricing summary stats
  const pricingStats = useMemo(() => {
    const count = products.length;
    const avgMargin = count
      ? products.reduce((s, p) => s + realizedMarginPct(p), 0) / count
      : 0;
    const ticket = count ? products.reduce((s, p) => s + finalPrice(p), 0) / count : 0;
    const risky = products.filter((p) => realizedMarginPct(p) < 20).length;
    return { count, avgMargin, ticket, risky };
  }, [products]);

  // Product mutation handlers
  const commitProduct = (next: Product, reason: string) =>
    setProducts((prev) => {
      const before = prev.find((p) => p.id === next.id);
      if (before) {
        const entries = diffProduct(before, next, currentUser.name, reason);
        if (entries.length > 0) setAuditLog((log) => [...entries, ...log]);
        return prev.map((p) => (p.id === next.id ? next : p));
      }
      setAuditLog((log) => [creationEntry(next, currentUser.name), ...log]);

      // Automatically register product in inventory if not present
      setInventory((inv) => {
        if (inv.some((i) => i.productId === next.id || i.name === next.name)) return inv;
        return [
          ...inv,
          {
            id: `inv-${next.id}`,
            productId: next.id,
            name: next.name,
            type: "produto_final",
            currentStock: 10,
            minStock: 5,
            unit: "un",
            unitCost: next.supplierPrice || 10,
            lastUpdated: new Date().toISOString(),
          },
        ];
      });

      return [next, ...prev];
    });

  const updateProduct = (id: string, patch: Partial<Product>, reason?: string) => {
    const before = products.find((p) => p.id === id);
    if (!before) return;
    commitProduct({ ...before, ...patch }, reason ?? "Ajuste rápido na tabela de precificação");
  };

  const removeProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (target) {
      setAuditLog((log) => [
        {
          ...creationEntry(target, currentUser.name),
          field: "Produto excluído",
          before: target.name,
          after: "—",
          reason: "Remoção do portfólio",
        },
        ...log,
      ]);
    }
  };

  // Inventory mutation handlers
  const handleUpdateStock = (
    itemId: string,
    delta: number,
    type: MovementType,
    reason: string,
    user: string,
  ) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const nextStock =
          type === "entrada"
            ? item.currentStock + delta
            : type === "saida" || type === "venda"
            ? Math.max(0, item.currentStock - delta)
            : delta;

        // Record movement
        const newMovement: StockMovement = {
          id: uid(),
          itemId: item.id,
          itemName: item.name,
          type,
          quantity: delta,
          balanceAfter: nextStock,
          reason,
          date: new Date().toISOString(),
          user,
        };
        setMovements((movs) => [newMovement, ...movs]);

        return { ...item, currentStock: nextStock, lastUpdated: new Date().toISOString() };
      }),
    );
  };

  const handleCreateInventoryItem = (item: InventoryItem) => {
    setInventory((prev) => [item, ...prev]);
    setMovements((movs) => [
      {
        id: uid(),
        itemId: item.id,
        itemName: item.name,
        type: "entrada",
        quantity: item.currentStock,
        balanceAfter: item.currentStock,
        reason: "Cadastro inicial no estoque",
        date: new Date().toISOString(),
        user: currentUser.name,
      },
      ...movs,
    ]);
  };

  // POS / Sales Checkout with automated stock deduction & cash flow integration
  const handleCompleteSale = (sale: Sale) => {
    // 1. Add sale
    setSales((prev) => [sale, ...prev]);

    // 2. Add cashflow transaction
    const newTx: CashTransaction = {
      id: uid(),
      type: "entrada",
      category: "Venda PDV",
      description: `Venda ${sale.code} (${sale.paymentMethod.toUpperCase()})`,
      amount: sale.netRevenue,
      date: sale.date,
      user: sale.user,
      saleId: sale.id,
    };
    setCashTransactions((prev) => [newTx, ...prev]);

    // 3. Automatic stock deduction ("Baixa automática")
    setInventory((prev) => {
      let updated = [...prev];
      sale.items.forEach((saleItem) => {
        const prod = products.find((p) => p.id === saleItem.productId);

        // Deduct the finished product
        updated = updated.map((item) => {
          if (item.productId === saleItem.productId || item.name === saleItem.name) {
            const nextQty = Math.max(0, item.currentStock - saleItem.quantity);
            setMovements((movs) => [
              {
                id: uid(),
                itemId: item.id,
                itemName: item.name,
                type: "venda",
                quantity: saleItem.quantity,
                balanceAfter: nextQty,
                reason: `Baixa automática venda ${sale.code}`,
                date: sale.date,
                user: sale.user,
              },
              ...movs,
            ]);
            return { ...item, currentStock: nextQty, lastUpdated: sale.date };
          }
          return item;
        });

        // Deduct raw materials / packaging if fabricated or resale with BOM
        if (prod) {
          const bomItems = prod.type === "fabricado" ? prod.bom : prod.packaging;
          bomItems?.forEach((ingredient) => {
            updated = updated.map((item) => {
              if (
                item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
                ingredient.name.toLowerCase().includes(item.name.toLowerCase())
              ) {
                const consumed = ingredient.quantity * saleItem.quantity;
                const nextQty = Math.max(0, item.currentStock - consumed);
                return { ...item, currentStock: nextQty, lastUpdated: sale.date };
              }
              return item;
            });
          });
        }
      });
      return updated;
    });
  };

  // Cashflow handler
  const handleAddTransaction = (tx: CashTransaction) => {
    setCashTransactions((prev) => [tx, ...prev]);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "fabricado", label: "Fabricado" },
    { key: "revenda", label: "Revenda" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        users={users}
        currentUserId={currentUserId}
        onSelectUser={setCurrentUserId}
        lowStockCount={lowStockCount}
      />

      {/* 2. Main Content Area (Spanning to the right of fixed Sidebar) */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white capitalize">
              {activeModule === "precificacao"
                ? "Precificação & Portfólio"
                : activeModule === "estoque"
                ? "Controle de Estoque"
                : activeModule === "vendas"
                ? "Frente de Caixa (PDV)"
                : activeModule === "fluxo_caixa"
                ? "Fluxo de Caixa"
                : activeModule === "usuarios"
                ? "Gestão de Usuários"
                : "Histórico de Auditoria"}
            </h1>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {roleLabel[currentUser.role]}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!canEdit && activeModule === "precificacao" && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> Modo Somente Leitura (Operacional)
              </span>
            )}

            {activeModule === "precificacao" && (
              <Button
                size="sm"
                disabled={!canEdit}
                onClick={() => {
                  setEditing(null);
                  setSheetOpen(true);
                }}
                className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                <Plus className="size-4" /> Novo Produto
              </Button>
            )}
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-8">
          {/* TAB 1: PRECIFICAÇÃO */}
          {activeModule === "precificacao" && (
            <div className="space-y-6">
              {/* Summary Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={Layers} label="Produtos no portfólio" value={String(pricingStats.count)} />
                <StatCard icon={TrendingUp} label="Margem média realizada" value={pct(pricingStats.avgMargin)} />
                <StatCard icon={TrendingUp} label="Ticket médio" value={brl(pricingStats.ticket)} />
                <StatCard
                  icon={AlertTriangle}
                  label="Itens com margem baixa"
                  value={String(pricingStats.risky)}
                  tone={pricingStats.risky > 0 ? "warning" : "default"}
                />
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-72 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9 bg-white dark:bg-slate-900"
                    placeholder="Buscar por nome do produto na tabela..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={cn(
                        "rounded-md px-4 py-1.5 text-xs font-semibold transition-all duration-150",
                        filter === f.key
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Data Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <PricingTable
                  products={filteredProducts}
                  auditLog={auditLog}
                  canEdit={canEdit}
                  onUpdate={updateProduct}
                  onEdit={(p) => {
                    setEditing(p);
                    setSheetOpen(true);
                  }}
                  onDelete={removeProduct}
                />
              </div>

              <p className="text-xs text-slate-500">
                Fórmula de Precificação: Custo Total ÷ (1 − (Margem % + Taxa da maquininha % + Taxas
                customizadas %)) + Logística fixa. Toda alteração de parâmetro ou preço gera registro
                no módulo de Auditoria.
              </p>
            </div>
          )}

          {/* TAB 2: ESTOQUE */}
          {activeModule === "estoque" && (
            <InventoryView
              inventory={inventory}
              movements={movements}
              canManage={canEdit}
              currentUserName={currentUser.name}
              onUpdateStock={handleUpdateStock}
              onCreateItem={handleCreateInventoryItem}
            />
          )}

          {/* TAB 3: VENDAS / PDV */}
          {activeModule === "vendas" && (
            <PosView
              products={products}
              inventory={inventory}
              sales={sales}
              currentUserName={currentUser.name}
              onCompleteSale={handleCompleteSale}
            />
          )}

          {/* TAB 4: FLUXO DE CAIXA */}
          {activeModule === "fluxo_caixa" && (
            <CashflowView
              transactions={cashTransactions}
              canManage={canEdit}
              currentUserName={currentUser.name}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {/* TAB 5: USUÁRIOS */}
          {activeModule === "usuarios" && (
            <UsersPanel
              users={users}
              canManage={canEdit}
              onCreate={(u) => setUsers((prev) => [...prev, u])}
              onUpdate={(id, patch) =>
                setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
              }
              onDelete={(id) =>
                setUsers((prev) => (prev.length > 1 ? prev.filter((u) => u.id !== id) : prev))
              }
            />
          )}

          {/* TAB 6: AUDITORIA */}
          {activeModule === "auditoria" && <AuditView entries={auditLog} />}
        </main>
      </div>

      {/* Product Drawer Sheet (for New/Edit product) */}
      <ProductSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setEditing(null);
        }}
        product={editing}
        onSave={(p, reason) => commitProduct(p, reason || "Alteração manual pelo painel de edição")}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className={cn("size-4", tone === "warning" ? "text-amber-500" : "text-indigo-500")} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums tracking-tight",
          tone === "warning" ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white",
        )}
      >
        {value}
      </p>
    </div>
  );
}
