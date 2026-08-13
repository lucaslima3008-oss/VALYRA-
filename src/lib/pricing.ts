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
  type: ProductType;
  // Fabricado
  bom: BomItem[];
  laborMinutes: number;
  laborCostPerMinute: number;
  // Revenda
  supplierPrice: number;
  freight: number;
  purchaseTax: number;
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

/** Custo total conforme o tipo do produto (inclui despesas fixas customizadas) */
export function totalCost(p: Product): number {
  const base =
    p.type === "fabricado"
      ? p.bom.reduce((sum, i) => sum + i.quantity * i.unitCost, 0) +
        p.laborMinutes * p.laborCostPerMinute
      : p.supplierPrice + p.freight + p.purchaseTax;
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
          ...customFixed.map((f) => ({
            label: `${f.name || "Taxa fixa"} (fixa)`,
            value: f.value,
          })),
        ];

  const priceLines: BreakdownLine[] = [
    { label: "Custo total", value: cost, total: true },
    {
      label: `Divisor de markup (1 − (${p.marginPct.toFixed(1)}% + ${p.cardFeePct.toFixed(
        1,
      )}%${customPercent.length > 0 ? ` + ${customPercentTotal(p).toFixed(1)}%` : ""}))`,
      value: divisor,
    },
    {
      label: "Preço sugerido (custo ÷ divisor + logística)",
      value: suggested,
      total: true,
    },
    ...(manual
      ? [
          {
            label: "Ajuste manual do preço praticado",
            value: price - suggested,
          },
          { label: "Preço final praticado", value: price, total: true },
        ]
      : []),
  ];

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
    priceLines,
    marginLines,
    realizedMarginPct: realizedMarginPct(p),
  };
}

export const brl = (v: number) =>
  isFinite(v)
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

export const pct = (v: number) => `${v.toFixed(1).replace(".", ",")}%`;

export const mockProducts: Product[] = [
  {
    ...emptyProduct(),
    id: "p1",
    name: "Bolo de Cenoura Premium 1,2kg",
    type: "fabricado",
    bom: [
      { id: uid(), name: "Cenoura orgânica (kg)", quantity: 0.4, unitCost: 8.9 },
      { id: uid(), name: "Farinha de trigo (kg)", quantity: 0.5, unitCost: 5.4 },
      { id: uid(), name: "Cobertura de chocolate (kg)", quantity: 0.3, unitCost: 32 },
      { id: uid(), name: "Embalagem rígida", quantity: 1, unitCost: 3.75 },
    ],
    laborMinutes: 45,
    laborCostPerMinute: 0.62,
    marginPct: 28,
    cardFeePct: 3.99,
    logisticsCost: 6.5,
    manualPrice: null,
  },
  {
    ...emptyProduct(),
    id: "p2",
    name: "Kit Presente Corporativo",
    type: "fabricado",
    bom: [
      { id: uid(), name: "Caneca cerâmica", quantity: 1, unitCost: 14.2 },
      { id: uid(), name: "Caixa kraft personalizada", quantity: 1, unitCost: 9.8 },
      { id: uid(), name: "Cartão impresso", quantity: 1, unitCost: 1.4 },
    ],
    laborMinutes: 18,
    laborCostPerMinute: 0.62,
    marginPct: 16,
    cardFeePct: 3.2,
    logisticsCost: 12,
    manualPrice: 62.9,
  },
  {
    ...emptyProduct(),
    id: "p3",
    name: "Café Especial Torrado 500g",
    type: "revenda",
    supplierPrice: 28.4,
    freight: 3.2,
    purchaseTax: 2.1,
    marginPct: 32,
    cardFeePct: 2.99,
    logisticsCost: 8.9,
    customFees: [
      { id: uid(), name: "Comissão Marketplace", kind: "percent", value: 12 },
      { id: uid(), name: "Embalagem especial", kind: "fixed", value: 2.5 },
    ],
    manualPrice: null,
  },
  {
    ...emptyProduct(),
    id: "p4",
    name: "Garrafa Térmica Inox 1L",
    type: "revenda",
    supplierPrice: 74.9,
    freight: 9.4,
    purchaseTax: 6.3,
    marginPct: 12,
    cardFeePct: 4.2,
    logisticsCost: 15,
    manualPrice: null,
  },
  {
    ...emptyProduct(),
    id: "p5",
    name: "Linha Artesanal — Vela de Soja 180g",
    type: "fabricado",
    bom: [
      { id: uid(), name: "Cera de soja (kg)", quantity: 0.18, unitCost: 42 },
      { id: uid(), name: "Essência importada (ml)", quantity: 12, unitCost: 0.38 },
      { id: uid(), name: "Pote de vidro", quantity: 1, unitCost: 6.1 },
    ],
    laborMinutes: 12,
    laborCostPerMinute: 0.55,
    marginPct: 41,
    cardFeePct: 3.5,
    logisticsCost: 7.4,
    manualPrice: null,
  },
];
