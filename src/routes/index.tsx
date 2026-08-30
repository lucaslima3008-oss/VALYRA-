import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Layers,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Database,
  RefreshCw,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Sidebar, type AppModule } from "@/components/layout/sidebar";
import { PricingTable } from "@/components/pricing/pricing-table";
import { UsersPanel } from "@/components/pricing/users-panel";
import { ProductsView } from "@/components/products/products-view";
import { InventoryView } from "@/components/inventory/inventory-view";
import { PosView } from "@/components/pos/pos-view";
import { CashflowView } from "@/components/cashflow/cashflow-view";
import { AuditView } from "@/components/audit/audit-view";
import { SettingsView } from "@/components/settings/settings-view";

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
  type PaymentStatus,
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
  updateSupabaseSalePayment,
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
      { title: "Valyra — Inteligência em Precificação" },
      {
        name: "description",
        content:
          "Plataforma completa B2B integrada ao Supabase para precificação inteligente com divisor de markup, controle de estoque com baixas automáticas, PDV, fluxo de caixa e auditoria.",
      },
      { property: "og:title", content: "Valyra — Inteligência em Precificação" },
      { property: "og:description", content: "Valyra: precificação inteligente, estoque, PDV, fluxo de caixa e auditoria em um só painel. Não precifique no escuro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [activeModule, setActiveModule] = useState<AppModule>("produtos");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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
    supplierCost?: number,
    freightCost?: number,
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

        // Update unit cost if supplier cost is provided on entry
        let newUnitCost = item.unitCost;
        if (type === "entrada" && supplierCost !== undefined && delta > 0) {
          const totalAcquisition = supplierCost + (freightCost || 0);
          newUnitCost = totalAcquisition / delta;
        }

        const updatedItem = {
          ...item,
          currentStock: nextStock,
          unitCost: newUnitCost,
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

  // Efeitos financeiros/operacionais de uma venda confirmada
  const applySaleEffects = async (sale: Sale) => {
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

  // POS / Sales Checkout — vendas com cobrança online só geram efeitos após a confirmação
  const handleCompleteSale = async (sale: Sale) => {
    setSales((prev) => [sale, ...prev]);
    await saveSupabaseSale(sale);

    const awaitingPayment = sale.paymentStatus === "pendente";
    if (!awaitingPayment) await applySaleEffects(sale);
  };

  // Atualização de status vinda do Mercado Pago (webhook/realtime/polling)
  const handleUpdateSaleStatus = async (saleCode: string, status: PaymentStatus) => {
    const target = sales.find((s) => s.code === saleCode);
    if (!target || target.paymentStatus === status) return;

    setSales((prev) =>
      prev.map((s) => (s.code === saleCode ? { ...s, paymentStatus: status } : s)),
    );
    await updateSupabaseSalePayment(saleCode, status);

    if (status === "pago" && target.paymentStatus !== "pago") {
      await applySaleEffects({ ...target, paymentStatus: "pago" });
    }
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
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex">
      {/* 1. Left Sidebar (fixa no desktop, retrátil em mobile/tablet) */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        users={users}
        currentUserId={currentUserId}
        onSelectUser={setCurrentUserId}
        lowStockCount={lowStockCount}
        mobileOpen={menuOpen}
        onCloseMobile={() => setMenuOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-[#D4AF37]/20 bg-[#0A0A0A]/85 px-3 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu de módulos"
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-[#D4AF37]/30 text-[#D4AF37] lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="truncate text-sm font-bold tracking-tight text-white capitalize sm:text-lg">
              {activeModule === "produtos"
                ? "Cadastro de Produtos"
                : activeModule === "precificacao"
                ? "Precificação & Margens"
                : activeModule === "estoque"
                ? "Controle de Estoque"
                : activeModule === "vendas"
                ? "Frente de Caixa (PDV)"
                : activeModule === "fluxo_caixa"
                ? "Fluxo de Caixa"
                : activeModule === "usuarios"
                ? "Gestão de Usuários"
                : activeModule === "configuracoes"
                ? "Configurações & Integrações"
                : "Histórico de Auditoria"}
            </h1>
            <span className="hidden shrink-0 rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-semibold text-[#D4AF37] sm:inline-block">
              {roleLabel[currentUser.role]}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Supabase Status Indicator */}
            <div
              className={cn(
                "hidden items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border xl:flex",
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
              className="size-11 sm:size-9"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>

            {!canEdit && activeModule === "precificacao" && (
              <span className="hidden text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-1.5 lg:flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> Modo Somente Leitura (Operacional)
              </span>
            )}


          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8">

          {/* TAB 0: PRODUTOS (CADASTRO) */}
          {activeModule === "produtos" && (
            <ProductsView
              products={products}
              canEdit={canEdit}
              onSaveProduct={(p, reason) => commitProduct(p, reason || "Alteração via cadastro de produtos")}
              onDeleteProduct={removeProduct}
            />
          )}

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
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="relative w-full flex-1 sm:min-w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9 bg-white dark:bg-slate-900"
                    placeholder="Buscar por nome do produto na tabela..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="inline-flex w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900 sm:w-auto">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={cn(
                        "min-h-9 flex-1 whitespace-nowrap rounded-md px-4 py-1.5 text-xs font-semibold transition-all duration-150 sm:flex-none",
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
              onUpdateSaleStatus={handleUpdateSaleStatus}
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

          {/* TAB 7: CONFIGURAÇÕES */}
          {activeModule === "configuracoes" && <SettingsView isAdmin={currentUser.role === "admin"} />}
        </main>

        <footer className="border-t border-[#D4AF37]/20 bg-[#0A0A0A]/80 px-4 py-4 text-[11px] text-white/50 sm:px-8 sm:text-xs">
          <span className="font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Valyra</span>
          <span className="mx-2">·</span>
          Inteligência em Precificação
          <span className="mx-2">·</span>
          <span className="italic">Não precifique no escuro.</span>
        </footer>

      </div>

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
