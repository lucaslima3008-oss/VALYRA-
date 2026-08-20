export type ProductType = "fabricado" | "revenda";

export type FeeKind = "percent" | "fixed";

export interface CustomFee {
  id: string;
  name: string;
  kind: FeeKind;
  value: number;
}

export interface BomItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  type: ProductType;
  // Fabricado
  bom: BomItem[];
  laborMinutes: number;
  laborCostPerMinute: number;
  // Revenda
  supplierPrice: number;
  freight: number;
  purchaseTax: number;
  /** Insumos de embalagem e brindes (revenda) */
  packaging: BomItem[];
  // Parâmetros de venda
  marginPct: number;
  cardFeePct: number;
  logisticsCost: number;
  /** Taxas e despesas customizadas */
  customFees: CustomFee[];
  /** Preço praticado quando ajustado manualmente */
  manualPrice: number | null;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyProduct = (): Product => ({
  id: uid(),
  name: "",
  type: "fabricado",
  bom: [],
  laborMinutes: 0,
  laborCostPerMinute: 0,
  supplierPrice: 0,
  freight: 0,
  purchaseTax: 0,
  packaging: [],
  marginPct: 25,
  cardFeePct: 3.5,
  logisticsCost: 0,
  customFees: [],
  manualPrice: null,
});

/** Soma das taxas customizadas percentuais */
export const customPercentTotal = (p: Product) =>
  (p.customFees ?? []).filter((f) => f.kind === "percent").reduce((s, f) => s + f.value, 0);

/** Soma das taxas customizadas em valor fixo */
export const customFixedTotal = (p: Product) =>
  (p.customFees ?? []).filter((f) => f.kind === "fixed").reduce((s, f) => s + f.value, 0);

/** Custo de embalagens e brindes (revenda) */
export const packagingCost = (p: Product) =>
  (p.packaging ?? []).reduce((s, i) => s + i.quantity * i.unitCost, 0);

/** Custo total conforme o tipo do produto (inclui despesas fixas customizadas) */
export function totalCost(p: Product): number {
  const base =
    p.type === "fabricado"
      ? p.bom.reduce((sum, i) => sum + i.quantity * i.unitCost, 0) +
        p.laborMinutes * p.laborCostPerMinute
      : p.supplierPrice +
        p.freight +
        p.purchaseTax +
        packagingCost(p);
  return base + customFixedTotal(p);
}

/**
 * Preço sugerido via divisor de markup:
 * Custo / (1 - (margem + taxas + taxas % customizadas)) + custos logísticos fixos.
 */
export function suggestedPrice(p: Product): number {
  const cost = totalCost(p);
  const divisor = 1 - (p.marginPct + p.cardFeePct + customPercentTotal(p)) / 100;
  if (divisor <= 0) return Number.POSITIVE_INFINITY;
  return cost / divisor + p.logisticsCost;
}

export function finalPrice(p: Product): number {
  return p.manualPrice ?? suggestedPrice(p);
}

/** Margem realizada com o preço praticado */
export function realizedMarginPct(p: Product): number {
  const price = finalPrice(p);
  if (!isFinite(price) || price <= 0) return 0;
  const net =
    price -
    p.logisticsCost -
    (price * (p.cardFeePct + customPercentTotal(p))) / 100 -
    totalCost(p);
  return (net / price) * 100;
}

export interface BreakdownLine {
  label: string;
  value: number;
  /** exibe o valor como destaque (totalizador) */
  total?: boolean;
  /** linha com efeito de subtração/despesa */
  negative?: boolean;
}

export interface PricingBreakdown {
  productName: string;
  productType: ProductType;
  costLines: BreakdownLine[];
  totalCost: number;
  divisor: number;
  marginPct: number;
  cardFeePct: number;
  customPercentTotal: number;
  logisticsCost: number;
  suggestedPrice: number;
  finalPrice: number;
  manualPrice: boolean;
  manualAdjustment: number;
  marginLines: BreakdownLine[];
  realizedMarginPct: number;
}

/** Decomposição completa do custo e do preço de venda */
export function buildPricingBreakdown(p: Product): PricingBreakdown {
  const cost = totalCost(p);
  const suggested = suggestedPrice(p);
  const price = finalPrice(p);
  const manual = p.manualPrice !== null;
  const customFixed = (p.customFees ?? []).filter((f) => f.kind === "fixed");
  const customPercent = (p.customFees ?? []).filter((f) => f.kind === "percent");
  const divisor =
    1 - (p.marginPct + p.cardFeePct + customPercentTotal(p)) / 100;

  const costLines: BreakdownLine[] =
    p.type === "fabricado"
      ? [
          ...p.bom.map((item) => ({
            label: `${item.name} (${item.quantity} × ${brl(item.unitCost)})`,
            value: item.quantity * item.unitCost,
          })),
          {
            label: `Mão de obra (${p.laborMinutes} min × ${brl(
              p.laborCostPerMinute,
            )})`,
            value: p.laborMinutes * p.laborCostPerMinute,
          },
          ...customFixed.map((f) => ({
            label: `${f.name || "Taxa fixa"} (fixa)`,
            value: f.value,
          })),
        ]
      : [
          { label: "Preço pago ao fornecedor", value: p.supplierPrice },
          { label: "Frete de aquisição", value: p.freight },
          { label: "Imposto de compra", value: p.purchaseTax },
          ...(p.packaging ?? []).map((item) => ({
            label: `${item.name || "Embalagem"} (${item.quantity} × ${brl(item.unitCost)})`,
            value: item.quantity * item.unitCost,
          })),
          ...customFixed.map((f) => ({
            label: `${f.name || "Taxa fixa"} (fixa)`,
            value: f.value,
          })),
        ];

  const manualAdjustment = manual ? price - suggested : 0;

  const cardFeeAmount = (price * p.cardFeePct) / 100;
  const customPercentAmount = (price * customPercentTotal(p)) / 100;
  const net = price - p.logisticsCost - cardFeeAmount - customPercentAmount - cost;

  const marginLines: BreakdownLine[] = [
    { label: "Preço final", value: price, total: true },
    { label: "Custo total", value: cost, negative: true },
    { label: "Logística", value: p.logisticsCost, negative: true },
    {
      label: `Taxa maquininha (${p.cardFeePct.toFixed(1)}%)`,
      value: cardFeeAmount,
      negative: true,
    },
    ...(customPercent.length > 0
      ? [
          {
            label: `Taxas customizadas % (${customPercentTotal(p).toFixed(1)}%)`,
            value: customPercentAmount,
            negative: true,
          },
        ]
      : []),
    { label: "Lucro líquido", value: net, total: true },
  ];

  return {
    productName: p.name,
    productType: p.type,
    costLines,
    totalCost: cost,
    divisor,
    marginPct: p.marginPct,
    cardFeePct: p.cardFeePct,
    customPercentTotal: customPercentTotal(p),
    logisticsCost: p.logisticsCost,
    suggestedPrice: suggested,
    finalPrice: price,
    manualPrice: manual,
    manualAdjustment,
    marginLines,
    realizedMarginPct: realizedMarginPct(p),
  };
}

export const brl = (v: number) =>
  isFinite(v)
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

export const pct = (v: number) => `${v.toFixed(1).replace(".", ",")}%`;

export const mockProducts: Product[] = [];
