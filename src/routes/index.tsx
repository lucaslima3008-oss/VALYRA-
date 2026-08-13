import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, Layers, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PricingTable } from "@/components/pricing/pricing-table";
import { ProductSheet } from "@/components/pricing/product-sheet";
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
          "Painel corporativo para calcular custos de produtos fabricados e de revenda, taxas, logística e preço de venda por markup.",
      },
      { property: "og:title", content: "Cost & Price — Gestão de Portfólio e Precificação" },
      {
        property: "og:description",
        content:
          "Cadastre fichas técnicas, controle taxas e audite margens com preço de venda calculado por divisor de markup.",
      },
    ],
  }),
  component: Index,
});

type Filter = "todos" | ProductType;

function Index() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const update = (id: string, patch: Partial<Product>) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const filters: { key: Filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "fabricado", label: "Fabricado" },
    { key: "revenda", label: "Revenda" },
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
            <Button size="lg" onClick={() => setSheetOpen(true)}>
              <Plus className="size-4" /> Novo Produto
            </Button>
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
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

        <PricingTable
          products={filtered}
          onUpdate={update}
          onDelete={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
        />

        <p className="mt-4 text-xs text-muted-foreground">
          Fórmula aplicada: Custo Total ÷ (1 − (Margem % + Taxa da maquininha %)) + Logística fixa.
          Preços editados manualmente exibem o valor sugerido para comparação.
        </p>
      </main>

      <ProductSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={(p) => setProducts((prev) => [p, ...prev])}
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
