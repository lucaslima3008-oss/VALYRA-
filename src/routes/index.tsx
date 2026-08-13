import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Layers,
  TrendingUp,
  AlertTriangle,
  Table2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PricingTable } from "@/components/pricing/pricing-table";
import { ProductSheet } from "@/components/pricing/product-sheet";
import { UsersPanel } from "@/components/pricing/users-panel";
import { creationEntry, diffProduct, type AuditEntry } from "@/lib/audit";
import { mockUsers, roleLabel, type AppUser } from "@/lib/users";
import {
  brl,
  mockProducts,
  pct,
  realizedMarginPct,
  finalPrice,
  type Product,
  type ProductType,
} from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cost & Price — Gestão de Portfólio e Precificação" },
      {
        name: "description",
        content:
          "Painel corporativo para calcular custos de produtos fabricados e de revenda, taxas, logística, auditoria de preços e acessos.",
      },
      { property: "og:title", content: "Cost & Price — Gestão de Portfólio e Precificação" },
      {
        property: "og:description",
        content:
          "Cadastre fichas técnicas, edite taxas a qualquer momento, audite alterações de preço e gerencie perfis de acesso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Filter = "todos" | ProductType;
type Tab = "precificacao" | "usuarios";

function Index() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [users, setUsers] = useState<AppUser[]>(mockUsers);
  const [currentUserId, setCurrentUserId] = useState(mockUsers[0].id);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [tab, setTab] = useState<Tab>("precificacao");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const currentUser = users.find((u) => u.id === currentUserId) ?? users[0];
  const canEdit = currentUser?.role === "admin" && currentUser?.status === "ativo";

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (filter === "todos" || p.type === filter) &&
          p.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [products, query, filter],
  );

  const stats = useMemo(() => {
    const count = products.length;
    const avgMargin = count
      ? products.reduce((s, p) => s + realizedMarginPct(p), 0) / count
      : 0;
    const ticket = count ? products.reduce((s, p) => s + finalPrice(p), 0) / count : 0;
    const risky = products.filter((p) => realizedMarginPct(p) < 20).length;
    return { count, avgMargin, ticket, risky };
  }, [products]);

  const commit = (next: Product, reason: string) =>
    setProducts((prev) => {
      const before = prev.find((p) => p.id === next.id);
      if (before) {
        const entries = diffProduct(before, next, currentUser.name, reason);
        if (entries.length > 0) setAuditLog((log) => [...entries, ...log]);
        return prev.map((p) => (p.id === next.id ? next : p));
      }
      setAuditLog((log) => [creationEntry(next, currentUser.name), ...log]);
      return [next, ...prev];
    });

  const update = (id: string, patch: Partial<Product>, reason?: string) => {
    const before = products.find((p) => p.id === id);
    if (!before) return;
    commit({ ...before, ...patch }, reason ?? "Ajuste rápido na tabela de precificação");
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

  const filters: { key: Filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "fabricado", label: "Fabricado" },
    { key: "revenda", label: "Revenda" },
  ];

  const tabs: { key: Tab; label: string; icon: typeof Table2 }[] = [
    { key: "precificacao", label: "Precificação", icon: Table2 },
    { key: "usuarios", label: "Gestão de Usuários", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Cost &amp; Price
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Gestão de Portfólio e Precificação
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Auditoria de custos, taxas e margens com preço calculado por divisor de markup.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border bg-surface px-3 py-2">
                <ShieldCheck
                  className={cn("size-4", canEdit ? "text-success" : "text-muted-foreground")}
                />
                <select
                  aria-label="Usuário conectado"
                  value={currentUserId}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  className="bg-transparent text-sm font-medium outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {roleLabel[u.role]}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size="lg"
                disabled={!canEdit}
                onClick={() => {
                  setEditing(null);
                  setSheetOpen(true);
                }}
              >
                <Plus className="size-4" /> Novo Produto
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Layers} label="Produtos no portfólio" value={String(stats.count)} />
            <StatCard icon={TrendingUp} label="Margem média realizada" value={pct(stats.avgMargin)} />
            <StatCard icon={TrendingUp} label="Ticket médio" value={brl(stats.ticket)} />
            <StatCard
              icon={AlertTriangle}
              label="Itens com margem baixa"
              value={String(stats.risky)}
              tone={stats.risky > 0 ? "warning" : "default"}
            />
          </div>

          <div className="mt-6 inline-flex rounded-lg border bg-surface p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200",
                  tab === t.key
                    ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon className="size-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {tab === "precificacao" ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-64 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por nome do produto..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="inline-flex rounded-lg border bg-card p-1">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200",
                      filter === f.key
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {!canEdit && (
              <div className="mb-4 rounded-lg border border-warning/40 bg-warning-soft px-4 py-2.5 text-xs font-medium text-warning">
                Perfil operacional: visualização apenas. Alterações de preços e parâmetros são
                restritas a administradores ativos.
              </div>
            )}

            <PricingTable
              products={filtered}
              auditLog={auditLog}
              canEdit={canEdit}
              onUpdate={update}
              onEdit={(p) => {
                setEditing(p);
                setSheetOpen(true);
              }}
              onDelete={removeProduct}
            />

            <p className="mt-4 text-xs text-muted-foreground">
              Fórmula aplicada: Custo Total ÷ (1 − (Margem % + Taxa da maquininha % + Taxas
              customizadas %)) + Logística fixa. Toda alteração de preço ou parâmetro é registrada no
              histórico de auditoria.
            </p>
          </>
        ) : (
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
      </main>

      <ProductSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setEditing(null);
        }}
        product={editing}
        onSave={(p, reason) => commit(p, reason || "Alteração manual pelo painel de edição")}
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
    <div className="rounded-xl border bg-surface px-4 py-3 transition-shadow duration-200 hover:shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={cn("size-3.5", tone === "warning" && "text-warning")} />
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={cn(
          "mt-1.5 text-xl font-semibold tabular-nums tracking-tight",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
    </div>
  );
}
