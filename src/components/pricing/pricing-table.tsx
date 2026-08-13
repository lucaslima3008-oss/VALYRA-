import { Factory, Store, RotateCcw, Trash2, PencilLine, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InlineNumberField } from "./inline-fields";
import {
  brl,
  finalPrice,
  pct,
  realizedMarginPct,
  suggestedPrice,
  totalCost,
  type Product,
} from "@/lib/pricing";

interface Props {
  products: Product[];
  onUpdate: (id: string, patch: Partial<Product>) => void;
  onDelete: (id: string) => void;
}

function MarginBadge({ value }: { value: number }) {
  const healthy = value >= 20;
  const low = value >= 10 && value < 20;
  return (
    <span
      className={cn(
        "inline-flex min-w-16 justify-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
        healthy && "bg-success-soft text-success",
        low && "bg-warning-soft text-warning",
        !healthy && !low && "bg-destructive/10 text-destructive",
      )}
    >
      {pct(value)}
    </span>
  );
}

export function PricingTable({ products, onUpdate, onDelete }: Props) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
        <p className="text-sm font-medium">Nenhum produto encontrado</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ajuste os filtros ou cadastre um novo produto no portfólio.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-surface text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 text-left font-semibold">Descrição do produto</th>
              <th className="px-4 py-3 text-left font-semibold">Tipo</th>
              <th className="px-4 py-3 text-right font-semibold">Custo total</th>
              <th className="px-4 py-3 text-right font-semibold">Taxa maquininha</th>
              <th className="px-4 py-3 text-right font-semibold">Logística</th>
              <th className="px-4 py-3 text-right font-semibold">Margem</th>
              <th className="px-4 py-3 text-right font-semibold">Preço final</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const cost = totalCost(p);
              const suggested = suggestedPrice(p);
              const price = finalPrice(p);
              const margin = realizedMarginPct(p);
              const manual = p.manualPrice !== null;
              return (
                <tr
                  key={p.id}
                  className="border-b border-border/70 transition-colors duration-200 last:border-0 hover:bg-muted/40"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          p.type === "fabricado"
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {p.type === "fabricado" ? (
                          <Factory className="size-4" />
                        ) : (
                          <Store className="size-4" />
                        )}
                      </span>
                      <div>
                        <p className="font-medium leading-tight">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.type === "fabricado"
                            ? `${p.bom.length} itens de ficha técnica · ${p.laborMinutes} min`
                            : `Aquisição ${brl(p.supplierPrice)}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        p.type === "fabricado"
                          ? "border-brand/40 bg-accent text-accent-foreground"
                          : "border-border bg-secondary text-secondary-foreground",
                      )}
                    >
                      {p.type === "fabricado" ? "Fabricado" : "Revenda"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{brl(cost)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <InlineNumberField
                        ariaLabel={`Taxa maquininha de ${p.name}`}
                        value={p.cardFeePct}
                        suffix="%"
                        onChange={(v) => onUpdate(p.id, { cardFeePct: v })}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <InlineNumberField
                        ariaLabel={`Logística de ${p.name}`}
                        value={p.logisticsCost}
                        prefix="R$"
                        onChange={(v) => onUpdate(p.id, { logisticsCost: v })}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <MarginBadge value={margin} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {manual && (
                        <PencilLine
                          className="size-3.5 text-muted-foreground"
                          aria-label="Preço ajustado manualmente"
                        />
                      )}
                      <InlineNumberField
                        ariaLabel={`Preço final de ${p.name}`}
                        value={price}
                        prefix="R$"
                        emphasis
                        onChange={(v) => onUpdate(p.id, { manualPrice: v })}
                      />
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      {manual && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Restaurar preço sugerido"
                          title="Restaurar preço sugerido"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => onUpdate(p.id, { manualPrice: null })}
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remover produto"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(p.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
