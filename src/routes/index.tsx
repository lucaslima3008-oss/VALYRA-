import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Layers,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Database,
  RefreshCw,
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
import { roleLabel, mockUsers, type AppUser } from "@/lib/users";
import {
  brl,
  pct,
  realizedMarginPct,
  finalPrice,
  uid,
  mockProducts,
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

import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchSupabaseProducts,
  saveSupabaseProduct,
  deleteSupabaseProduct,
  fetchSupabaseInventory,
  saveSupabaseInventoryItem,
  fetchSupabaseMovements,
  recordSupabaseMovement,
  fetchSupabaseSales,
  saveSupabaseSale,
  fetchSupabaseCashflow,
  saveSupabaseCashTransaction,
  fetchSupabaseUsers,
  saveSupabaseUser,
  deleteSupabaseUser,
  fetchSupabaseAudit,
  recordSupabaseAudit,
} from "@/lib/supabase-service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cost & Price — Gestão de Portfólio, Estoque e Precificação" },
      {
        name: "description",
        content:
          "Plataforma completa B2B integrada ao Supabase para precificação inteligente com divisor de markup, controle de estoque com baixas automáticas, PDV, fluxo de caixa e auditoria.",
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
  // Global Navigation
  const [activeModule, setActiveModule] = useState<AppModule>("precificacao");
  const [loading, setLoading] = useState(true);

  // Database State (initialized with fallback data for immediate render)
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(initialCashTransactions);
  const [users, setUsers] = useState<AppUser[]>(mockUsers);
  const [currentUserId, setCurrentUserId] = useState<string>(mockUsers[0]?.id || "usr-1");
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  // Pricing Filter State
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  // 1. Initial Load from Supabase
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [prods, inv, movs, sls, txs, usrs, logs] = await Promise.all([
        fetchSupabaseProducts(),
        fetchSupabaseInventory(),
        fetchSupabaseMovements(),
        fetchSupabaseSales(),
        fetchSupabaseCashflow(),
        fetchSupabaseUsers(),
        fetchSupabaseAudit(),
      ]);

      setProducts(prods);
      setInventory(inv);
      setMovements(movs);
      setSales(sls);
      setCashTransactions(txs);
      setUsers(usrs);
      if (usrs.length > 0 && usrs[0] && !currentUserId) {
        setCurrentUserId(usrs[0].id);
      }
      setAuditLog(logs);
    } catch (err) {
      console.error("Erro ao carregar dados do Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const currentUser =
    users.find((u) => u.id === currentUserId) ||
    users[0] || {
      id: "usr-admin",
      name: "Administrador",
      email: "admin@empresa.com.br",
      role: "admin" as const,
      status: "ativo" as const,
    };

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
  const commitProduct = async (next: Product, reason: string) => {
    const before = products.find((p) => p.id === next.id);
    if (before) {
      const entries = diffProduct(before, next, currentUser.name, reason);
      if (entries.length > 0) {
        setAuditLog((log) => [...entries, ...log]);
        entries.forEach((e) => recordSupabaseAudit(e));
      }
      setProducts((prev) => prev.map((p) => (p.id === next.id ? next : p)));
    } else {
      const entry = creationEntry(next, currentUser.name);
      setAuditLog((log) => [entry, ...log]);
      recordSupabaseAudit(entry);
      setProducts((prev) => [next, ...prev]);

      // Automatically register product in inventory if not present
      const newInvItem: InventoryItem = {
        id: `inv-${next.id}`,
        productId: next.id,
        name: next.name,
        type: "produto_final",
        currentStock: 10,
        minStock: 5,
        unit: "un",
        unitCost: next.supplierPrice || 10,
        lastUpdated: new Date().toISOString(),
      };
      setInventory((inv) => [newInvItem, ...inv]);
      saveSupabaseInventoryItem(newInvItem);
    }

    await saveSupabaseProduct(next);
  };

  const updateProduct = (id: string, patch: Partial<Product>, reason?: string) => {
    const before = products.find((p) => p.id === id);
    if (!before) return;
    commitProduct({ ...before, ...patch }, reason ?? "Ajuste rápido na tabela de precificação");
  };

  const removeProduct = async (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (target) {
      const entry: AuditEntry = {
        ...creationEntry(target, currentUser.name),
        field: "Produto excluído",
        before: target.name,
        after: "—",
        reason: "Remoção do portfólio",
      };
      setAuditLog((log) => [entry, ...log]);
      recordSupabaseAudit(entry);
    }
    await deleteSupabaseProduct(id);
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

        const updatedItem = {
          ...item,
          currentStock: nextStock,
          lastUpdated: new Date().toISOString(),
        };

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
        saveSupabaseInventoryItem(updatedItem);
        recordSupabaseMovement(newMovement);

        return updatedItem;
      }),
    );
  };

  const handleCreateInventoryItem = (item: InventoryItem) => {
    setInventory((prev) => [item, ...prev]);
    saveSupabaseInventoryItem(item);

    const mov: StockMovement = {
      id: uid(),
      itemId: item.id,
      itemName: item.name,
      type: "entrada",
      quantity: item.currentStock,
      balanceAfter: item.currentStock,
      reason: "Cadastro inicial no estoque",
      date: new Date().toISOString(),
      user: currentUser.name,
    };
    setMovements((movs) => [mov, ...movs]);
    recordSupabaseMovement(mov);
  };

  // POS / Sales Checkout with automated stock deduction & cash flow integration
  const handleCompleteSale = async (sale: Sale) => {
    // 1. Persist sale
    setSales((prev) => [sale, ...prev]);
    await saveSupabaseSale(sale);

    // 2. Persist cashflow transaction
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
    await saveSupabaseCashTransaction(newTx);

    // 3. Automatic stock deduction ("Baixa automática")
    setInventory((prev) => {
      let updated = [...prev];
      sale.items.forEach((saleItem) => {
        const prod = products.find((p) => p.id === saleItem.productId);

        // Deduct finished product
        updated = updated.map((item) => {
          if (item.productId === saleItem.productId || item.name === saleItem.name) {
            const nextQty = Math.max(0, item.currentStock - saleItem.quantity);
            const mov: StockMovement = {
              id: uid(),
              itemId: item.id,
              itemName: item.name,
              type: "venda",
              quantity: saleItem.quantity,
              balanceAfter: nextQty,
              reason: `Baixa automática venda ${sale.code}`,
              date: sale.date,
              user: sale.user,
            };
            setMovements((movs) => [mov, ...movs]);
            recordSupabaseMovement(mov);

            const updatedItem = { ...item, currentStock: nextQty, lastUpdated: sale.date };
            saveSupabaseInventoryItem(updatedItem);
            return updatedItem;
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
                const updatedItem = { ...item, currentStock: nextQty, lastUpdated: sale.date };
                saveSupabaseInventoryItem(updatedItem);
                return updatedItem;
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
  const handleAddTransaction = async (tx: CashTransaction) => {
    setCashTransactions((prev) => [tx, ...prev]);
    await saveSupabaseCashTransaction(tx);
  };

  // Users handler
  const handleCreateUser = async (u: AppUser) => {
    setUsers((prev) => [...prev, u]);
    await saveSupabaseUser(u);
  };

  const handleUpdateUser = async (id: string, patch: Partial<AppUser>) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === id ? { ...u, ...patch } : u));
      const target = updated.find((u) => u.id === id);
      if (target) saveSupabaseUser(target);
      return updated;
    });
  };

  const handleDeleteUser = async (id: string) => {
    if (users.length <= 1) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    await deleteSupabaseUser(id);
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

      {/* 2. Main Content Area */}
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
            {/* Supabase Status Indicator */}
            <div
              className={cn(
                "hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border",
                isSupabaseConfigured
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
              )}
            >
              <Database className="size-3.5" />
              <span>{isSupabaseConfigured ? "Supabase Conectado" : "Supabase Modo Local / Sync"}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              title="Recarregar Dados"
              onClick={loadAllData}
              disabled={loading}
              className="size-8"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            </Button>

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
                no módulo de Auditoria e é persistida no Supabase.
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
              onCreate={handleCreateUser}
              onUpdate={handleUpdateUser}
              onDelete={handleDeleteUser}
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
