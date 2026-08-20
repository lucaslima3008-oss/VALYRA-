import {
  Factory,
  Store,
  RotateCcw,
  Tags,
  Calculator,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InlineNumberField } from "./inline-fields";
import { HistoryDialog } from "./history-dialog";
import type { AuditEntry } from "@/lib/audit";
import {
  brl,
  buildPricingBreakdown,
  finalPrice,
  pct,
  realizedMarginPct,
  suggestedPrice,
  totalCost,
  type Product,
} from "@/lib/pricing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  products: Product[];
  auditLog: AuditEntry[];
  canEdit: boolean;
  onUpdate: (id: string, patch: Partial<Product>, reason?: string) => void;
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

function BreakdownDialog({ product }: { product: Product }) {
  const b = buildPricingBreakdown(product);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Detalhar cálculo"
          title="Detalhar cálculo"
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <Calculator className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhamento do cálculo</DialogTitle>
          <DialogDescription>
            {b.productName}
            <span
              className={cn(
                "ml-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                b.productType === "fabricado"
                  ? "border-brand/40 bg-accent text-accent-foreground"
                  : "border-border bg-secondary text-secondary-foreground",
              )}
            >
              {b.productType === "fabricado" ? "Fabricado" : "Revenda"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 pt-2 sm:grid-cols-2">
          <section className="rounded-xl border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Composição do custo total
            </h3>
            <ul className="space-y-2 text-sm">
              {b.costLines.map((line, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{line.label}</span>
                  <span className="tabular-nums font-medium">{brl(line.value)}</span>
                </li>
              ))}
              <li className="mt-2 flex justify-between gap-3 border-t pt-2 font-semibold">
                <span>Custo total</span>
                <span className="tabular-nums">{brl(b.totalCost)}</span>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Formação do preço de venda
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Custo total</span>
                <span className="tabular-nums font-medium">{brl(b.totalCost)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Margem alvo</span>
                <span className="tabular-nums font-medium">{pct(b.marginPct)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Taxa maquininha</span>
                <span className="tabular-nums font-medium">{pct(b.cardFeePct)}</span>
              </li>
              {b.customPercentTotal > 0 && (
                <li className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Taxas customizadas %</span>
                  <span className="tabular-nums font-medium">{pct(b.customPercentTotal)}</span>
                </li>
              )}
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Divisor de markup</span>
                <span className="tabular-nums font-medium">
                  {b.divisor > 0 ? b.divisor.toFixed(4) : "—"}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Logística fixa</span>
                <span className="tabular-nums font-medium">{brl(b.logisticsCost)}</span>
              </li>
              <li className="mt-2 flex justify-between gap-3 border-t pt-2 font-semibold">
                <span>Preço sugerido</span>
                <span className="tabular-nums">{brl(b.suggestedPrice)}</span>
              </li>
              {b.manualPrice && (
                <li className="flex justify-between gap-3 text-primary">
                  <span>Preço praticado (manual)</span>
                  <span className="tabular-nums font-semibold">{brl(b.finalPrice)}</span>
                </li>
              )}
            </ul>
          </section>
        </div>

        <section className="rounded-xl border bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Demonstrativo da margem realizada
          </h3>
          <ul className="space-y-2 text-sm">
            {b.marginLines.map((line, i) => (
              <li
                key={i}
                className={cn(
                  "flex justify-between gap-3",
                  line.total && "border-t pt-2 font-semibold",
                )}
              >
                <span className={cn(line.negative && "text-muted-foreground")}>{line.label}</span>
                <span
                  className={cn(
                    "tabular-nums font-medium",
                    line.negative && "text-muted-foreground",
                    line.total && "font-semibold text-foreground",
                  )}
                >
                  {line.negative ? "− " : ""}
                  {brl(Math.abs(line.value))}
                </span>
              </li>
            ))}
            <li className="mt-2 flex justify-between gap-3 border-t pt-2">
              <span className="font-semibold">Margem realizada</span>
              <MarginBadge value={b.realizedMarginPct} />
            </li>
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}

export function PricingTable({
  products,
  auditLog,
  canEdit,
  onUpdate,
}: Props) {
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
              const fees = p.customFees ?? [];
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
                        <p className="flex items-center gap-1.5 font-medium leading-tight">
                          {p.name}
                          {fees.length > 0 && (
                            <span
                              title={`Taxas customizadas: ${fees.map((f) => f.name || "Sem nome").join(", ")}`}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                            >
                              <Tags className="size-3" />
                              {fees.length}
                            </span>
                          )}
                        </p>
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
                        disabled={!canEdit}
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
                        disabled={!canEdit}
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
                        >
                          <title>{`Preço manual · sugerido ${brl(suggested)}`}</title>
                        </PencilLine>
                      )}
                      <InlineNumberField
                        ariaLabel={`Preço final de ${p.name}`}
                        value={price}
                        prefix="R$"
                        emphasis
                        disabled={!canEdit}
                        onChange={(v) => onUpdate(p.id, { manualPrice: v })}
                      />
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <BreakdownDialog product={p} />
                      <HistoryDialog
                        product={p}
                        entries={auditLog.filter((e) => e.productId === p.id)}
                      />
                      {canEdit && manual && (
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
