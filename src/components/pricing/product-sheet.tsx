import { useEffect, useMemo, useState } from "react";
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
  Gift,
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
  type BomItem,
  type Product,
  type ProductType,
  type CustomFee,
  type FeeKind,
} from "@/lib/pricing";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Produto em edição; ausente = cadastro novo */
  product?: Product | null;
  onSave: (p: Product, reason: string) => void;
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

function ItemsEditor({
  items,
  onChange,
  addLabel,
  emptyHint,
  placeholder,
}: {
  items: BomItem[];
  onChange: (items: BomItem[]) => void;
  addLabel: string;
  emptyHint: string;
  placeholder: string;
}) {
  const patch = (id: string, p: Partial<BomItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...p } : i)));
  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-center text-xs text-muted-foreground">
          {emptyHint}
        </p>
      )}
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="grid grid-cols-[1fr_4rem_2.5rem] items-end gap-2 sm:grid-cols-[1fr_5rem_6rem_2rem] rounded-lg border bg-card p-3 shadow-[var(--shadow-card)]"
        >
          <div className="space-y-1">
            {idx === 0 && <Label className="text-[11px] text-muted-foreground">Item</Label>}
            <Input
              className="h-9"
              placeholder={placeholder}
              value={item.name}
              onChange={(e) => patch(item.id, { name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            {idx === 0 && <Label className="text-[11px] text-muted-foreground">Qtd.</Label>}
            <Input
              className="h-9 tabular-nums"
              type="number"
              step="0.01"
              value={item.quantity}
              onChange={(e) => patch(item.id, { quantity: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            {idx === 0 && <Label className="text-[11px] text-muted-foreground">Custo un.</Label>}
            <Input
              className="h-9 tabular-nums"
              type="number"
              step="0.01"
              value={item.unitCost}
              onChange={(e) => patch(item.id, { unitCost: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remover item"
            className="size-9 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(items.filter((i) => i.id !== item.id))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => onChange([...items, { id: uid(), name: "", quantity: 1, unitCost: 0 }])}
      >
        <Plus className="size-4" /> {addLabel}
      </Button>
    </div>
  );
}

export function ProductSheet({ open, onOpenChange, product, onSave }: Props) {
  const editing = !!product;
  const [draft, setDraft] = useState<Product>(emptyProduct);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraft(product ? { ...product } : emptyProduct());
    setReason("");
  }, [open, product]);

  const set = (patch: Partial<Product>) => setDraft((d) => ({ ...d, ...patch }));
  const patchFee = (id: string, patch: Partial<CustomFee>) =>
    setDraft((d) => ({
      ...d,
      customFees: d.customFees.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));

  const cost = useMemo(() => totalCost(draft), [draft]);
  const price = useMemo(() => suggestedPrice(draft), [draft]);

  const submit = () => {
    if (!draft.name.trim()) return;
    onSave(editing ? { ...draft } : { ...draft, id: uid() }, reason.trim());
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b bg-surface px-6 py-5">
          <SheetTitle className="text-lg tracking-tight">
            {editing ? "Editar Produto" : "Cadastro de Produto"}
          </SheetTitle>
          <SheetDescription>
            {editing
              ? "Altere custos, taxas e parâmetros de venda — os cálculos são atualizados na hora."
              : "Estruture a ficha de custos e os parâmetros de venda para calcular o preço ideal."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
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
              <ItemsEditor
                items={draft.bom}
                onChange={(bom) => set({ bom })}
                addLabel="Adicionar insumo/embalagem"
                emptyHint="Nenhum insumo adicionado ainda."
                placeholder="Insumo / embalagem"
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <section className="space-y-5">
              <StepLabel
                n={3}
                title="Custos de aquisição"
                hint="Compra, frete e despesas irrecuperáveis"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Gift className="size-4 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-semibold tracking-tight">
                      Insumos de embalagem e brindes
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Sacola, caixa, laço e cortesias — somam ao custo total base.
                    </p>
                  </div>
                </div>
                <ItemsEditor
                  items={draft.packaging ?? []}
                  onChange={(packaging) => set({ packaging })}
                  addLabel="Adicionar embalagem/brinde"
                  emptyHint="Nenhuma embalagem ou brinde adicionado."
                  placeholder="Ex.: Sacola kraft, laço, caixa"
                />
              </div>
            </section>
          )}

          <Separator />

          <section className="space-y-4">
            <StepLabel n={4} title="Parâmetros de venda" hint="Margem alvo, taxas e logística" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            {editing && (
              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
                <NumInput
                  label="Preço praticado manual (R$)"
                  icon={CircleDollarSign}
                  value={draft.manualPrice ?? 0}
                  onChange={(v) => set({ manualPrice: v })}
                />
                <Button
                  variant="outline"
                  disabled={draft.manualPrice === null}
                  onClick={() => set({ manualPrice: null })}
                >
                  Usar preço sugerido
                </Button>
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-4">
            <StepLabel
              n={5}
              title="Composição de Taxas e Despesas Customizadas"
              hint="Percentuais entram no divisor de markup; valores fixos somam ao custo"
            />
            <div className="space-y-2">
              {draft.customFees.length === 0 && (
                <p className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-center text-xs text-muted-foreground">
                  Nenhuma taxa customizada. Ex.: Comissão Marketplace, Taxa de Antecipação.
                </p>
              )}
              {draft.customFees.map((fee) => (
                <div
                  key={fee.id}
                  className="grid grid-cols-[1fr_auto_2.5rem] items-center gap-2 sm:grid-cols-[1fr_auto_6rem_2rem] rounded-lg border bg-card p-3 shadow-[var(--shadow-card)]"
                >
                  <Input
                    className="h-9"
                    placeholder="Nome do componente"
                    value={fee.name}
                    onChange={(e) => patchFee(fee.id, { name: e.target.value })}
                  />
                  <div className="inline-flex rounded-md border bg-surface p-0.5">
                    {(
                      [
                        { k: "percent", label: "%" },
                        { k: "fixed", label: "R$" },
                      ] as { k: FeeKind; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.k}
                        type="button"
                        onClick={() => patchFee(fee.id, { kind: opt.k })}
                        className={cn(
                          "rounded px-2.5 py-1 text-xs font-semibold transition-colors duration-200",
                          fee.kind === opt.k
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <Input
                    className="h-9 tabular-nums"
                    type="number"
                    step="0.01"
                    value={fee.value}
                    onChange={(e) => patchFee(fee.id, { value: parseFloat(e.target.value) || 0 })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover componente"
                    className="size-9 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      set({ customFees: draft.customFees.filter((f) => f.id !== fee.id) })
                    }
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
                    customFees: [
                      ...draft.customFees,
                      { id: uid(), name: "", kind: "percent", value: 0 },
                    ],
                  })
                }
              >
                <Plus className="size-4" /> Adicionar Componente
              </Button>
            </div>
          </section>

          {editing && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Motivo da alteração (registrado na auditoria)
              </Label>
              <Input
                placeholder="Ex.: Reajuste de fornecedor, nova comissão do marketplace"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" className="min-h-11 w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="min-h-11 w-full sm:w-auto" onClick={submit} disabled={!draft.name.trim()}>
              {editing ? "Salvar alterações" : "Salvar produto"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
