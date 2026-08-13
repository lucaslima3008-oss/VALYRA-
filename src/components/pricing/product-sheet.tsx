import { useMemo, useState } from "react";
import {
  Factory,
  Store,
  Plus,
  Trash2,
  Clock,
  Receipt,
  Percent,
  Truck,
  CircleDollarSign,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  brl,
  emptyProduct,
  suggestedPrice,
  totalCost,
  uid,
  type Product,
  type ProductType,
} from "@/lib/pricing";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (p: Product) => void;
}

function StepLabel({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
        {n}
      </span>
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function NumInput({
  label,
  icon: Icon,
  value,
  onChange,
  step = "0.01",
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          type="number"
          step={step}
          className={cn("tabular-nums", Icon && "pl-9")}
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}

export function ProductSheet({ open, onOpenChange, onSave }: Props) {
  const [draft, setDraft] = useState<Product>(emptyProduct);
  const set = (patch: Partial<Product>) => setDraft((d) => ({ ...d, ...patch }));

  const cost = useMemo(() => totalCost(draft), [draft]);
  const price = useMemo(() => suggestedPrice(draft), [draft]);

  const reset = () => setDraft(emptyProduct());

  const submit = () => {
    if (!draft.name.trim()) return;
    onSave({ ...draft, id: uid() });
    reset();
    onOpenChange(false);
  };

  const typeButton = (type: ProductType, label: string, Icon: typeof Factory) => (
    <button
      type="button"
      onClick={() => set({ type })}
      className={cn(
        "flex flex-1 items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200",
        draft.type === type
          ? "border-brand bg-accent shadow-[var(--shadow-focus)]"
          : "border-border bg-card hover:border-brand/50 hover:bg-muted/60",
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-md transition-colors",
          draft.type === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b bg-surface px-6 py-5">
          <SheetTitle className="text-lg tracking-tight">Cadastro de Produto</SheetTitle>
          <SheetDescription>
            Estruture a ficha de custos e os parâmetros de venda para calcular o preço ideal.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          <section className="space-y-4">
            <StepLabel n={1} title="Informações básicas" hint="Identificação e natureza do item" />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Descrição do produto
              </Label>
              <Input
                placeholder="Ex.: Bolo de Cenoura Premium 1,2kg"
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              {typeButton("fabricado", "Produto Fabricado", Factory)}
              {typeButton("revenda", "Produto Revenda", Store)}
            </div>
          </section>

          <Separator />

          {draft.type === "fabricado" ? (
            <section className="space-y-4">
              <StepLabel
                n={2}
                title="Ficha técnica (BOM) e mão de obra"
                hint="Insumos, embalagens e tempo produtivo"
              />

              <div className="space-y-2">
                {draft.bom.length === 0 && (
                  <p className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-center text-xs text-muted-foreground">
                    Nenhum insumo adicionado ainda.
                  </p>
                )}
                {draft.bom.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_5rem_6rem_2rem] items-end gap-2 rounded-lg border bg-card p-3 shadow-[var(--shadow-card)]"
                  >
                    <div className="space-y-1">
                      {idx === 0 && (
                        <Label className="text-[11px] text-muted-foreground">Item</Label>
                      )}
                      <Input
                        className="h-9"
                        placeholder="Insumo / embalagem"
                        value={item.name}
                        onChange={(e) =>
                          set({
                            bom: draft.bom.map((b) =>
                              b.id === item.id ? { ...b, name: e.target.value } : b,
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && (
                        <Label className="text-[11px] text-muted-foreground">Qtd.</Label>
                      )}
                      <Input
                        className="h-9 tabular-nums"
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          set({
                            bom: draft.bom.map((b) =>
                              b.id === item.id
                                ? { ...b, quantity: parseFloat(e.target.value) || 0 }
                                : b,
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && (
                        <Label className="text-[11px] text-muted-foreground">Custo un.</Label>
                      )}
                      <Input
                        className="h-9 tabular-nums"
                        type="number"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) =>
                          set({
                            bom: draft.bom.map((b) =>
                              b.id === item.id
                                ? { ...b, unitCost: parseFloat(e.target.value) || 0 }
                                : b,
                            ),
                          })
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover insumo"
                      className="size-9 text-muted-foreground hover:text-destructive"
                      onClick={() => set({ bom: draft.bom.filter((b) => b.id !== item.id) })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() =>
                    set({
                      bom: [...draft.bom, { id: uid(), name: "", quantity: 1, unitCost: 0 }],
                    })
                  }
                >
                  <Plus className="size-4" /> Adicionar insumo/embalagem
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumInput
                  label="Tempo gasto (minutos)"
                  icon={Clock}
                  step="1"
                  value={draft.laborMinutes}
                  onChange={(v) => set({ laborMinutes: v })}
                />
                <NumInput
                  label="Custo mão de obra (R$/min)"
                  icon={CircleDollarSign}
                  value={draft.laborCostPerMinute}
                  onChange={(v) => set({ laborCostPerMinute: v })}
                />
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <StepLabel
                n={3}
                title="Custos de aquisição"
                hint="Compra, frete e despesas irrecuperáveis"
              />
              <div className="grid grid-cols-2 gap-3">
                <NumInput
                  label="Preço pago ao fornecedor"
                  icon={CircleDollarSign}
                  value={draft.supplierPrice}
                  onChange={(v) => set({ supplierPrice: v })}
                />
                <NumInput
                  label="Frete de aquisição"
                  icon={Truck}
                  value={draft.freight}
                  onChange={(v) => set({ freight: v })}
                />
                <NumInput
                  label="Imposto de compra (irrecuperável)"
                  icon={Receipt}
                  value={draft.purchaseTax}
                  onChange={(v) => set({ purchaseTax: v })}
                />
              </div>
            </section>
          )}

          <Separator />

          <section className="space-y-4">
            <StepLabel n={4} title="Parâmetros de venda" hint="Margem alvo, taxas e logística" />
            <div className="grid grid-cols-3 gap-3">
              <NumInput
                label="Margem alvo (%)"
                icon={Percent}
                value={draft.marginPct}
                onChange={(v) => set({ marginPct: v })}
              />
              <NumInput
                label="Taxa maquininha (%)"
                icon={Percent}
                value={draft.cardFeePct}
                onChange={(v) => set({ cardFeePct: v })}
              />
              <NumInput
                label="Logística (R$)"
                icon={Truck}
                value={draft.logisticsCost}
                onChange={(v) => set({ logisticsCost: v })}
              />
            </div>
          </section>
        </div>

        <div className="border-t bg-surface px-6 py-4">
          <div className="mb-4 flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Custo total
              </p>
              <p className="text-base font-semibold tabular-nums">{brl(cost)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Preço sugerido
              </p>
              <p className="text-base font-semibold tabular-nums text-primary">{brl(price)}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={!draft.name.trim()}>
              Salvar produto
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
