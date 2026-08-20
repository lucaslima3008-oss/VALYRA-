import React, { useState, useMemo } from "react";
import { Search, Plus, Package, Factory, Store, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { brl, totalCost, type Product, type ProductType } from "@/lib/pricing";
import { ProductSheet } from "@/components/pricing/product-sheet";

interface ProductsViewProps {
  products: Product[];
  canEdit: boolean;
  onSaveProduct: (product: Product, reason: string) => void;
  onDeleteProduct: (id: string) => void;
}

export function ProductsView({
  products,
  canEdit,
  onSaveProduct,
  onDeleteProduct,
}: ProductsViewProps) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"todos" | ProductType>("todos");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchQuery = p.name.toLowerCase().includes(query.toLowerCase());
      const matchType = filterType === "todos" || p.type === filterType;
      return matchQuery && matchType;
    });
  }, [products, query, filterType]);

  const stats = useMemo(() => {
    const total = products.length;
    const fabricados = products.filter(p => p.type === "fabricado").length;
    const revenda = products.filter(p => p.type === "revenda").length;
    return { total, fabricados, revenda };
  }, [products]);

  const handleCreate = () => {
    setEditingProduct(null);
    setSheetOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setSheetOpen(true);
  };

  const handleSave = (p: Product, reason: string) => {
    onSaveProduct(p, reason);
    setSheetOpen(false);
  };

  return (
    <div className="flex h-full flex-col bg-background p-6 lg:p-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastro de Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o portfólio, fichas técnicas, insumos e custos base.
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleCreate} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="size-4" />
            Novo Produto
          </Button>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Total de Produtos</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stats.total}</span>
            <span className="text-xs text-muted-foreground">cadastrados</span>
          </div>
        </div>
        <div className="rounded-xl border bg-accent/10 p-4 shadow-sm">
          <div className="text-sm font-medium text-accent-foreground">Fabricação Própria</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-accent-foreground">{stats.fabricados}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-secondary/10 p-4 shadow-sm">
          <div className="text-sm font-medium text-secondary-foreground">Revenda</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-secondary-foreground">{stats.revenda}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "fabricado", "revenda"] as const).map((t) => (
            <Button
              key={t}
              variant={filterType === t ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-surface text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 text-left font-semibold">Produto</th>
                <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                <th className="px-4 py-3 text-right font-semibold">Custo Total</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const cost = totalCost(p);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border/70 transition-colors duration-200 last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{p.name}</span>
                          {p.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                            p.type === "fabricado"
                              ? "bg-accent/20 text-accent-foreground"
                              : "bg-secondary/20 text-secondary-foreground",
                          )}
                        >
                          {p.type === "fabricado" ? <Factory className="size-3" /> : <Store className="size-3" />}
                          <span className="capitalize">{p.type}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                        {brl(cost)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(p)}
                            disabled={!canEdit}
                            className="size-8 hover:text-primary"
                          >
                            <PencilLine className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            disabled={!canEdit}
                            className="size-8 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        product={editingProduct}
        onSave={handleSave}
      />
    </div>
  );
}
