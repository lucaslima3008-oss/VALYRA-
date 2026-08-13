import {
  brl,
  finalPrice,
  suggestedPrice,
  totalCost,
  uid,
  type CustomFee,
  type Product,
} from "@/lib/pricing";

export type AuditKind = "preco" | "parametro";

export interface AuditEntry {
  id: string;
  productId: string;
  /** ISO timestamp */
  at: string;
  user: string;
  kind: AuditKind;
  /** Campo / componente alterado */
  field: string;
  before: string;
  after: string;
  reason: string;
}

const money = (v: number | null) => (v === null ? "—" : brl(v));
const percent = (v: number) => `${v.toFixed(2).replace(".", ",")}%`;
const num = (v: number) => v.toLocaleString("pt-BR");

const feeLabel = (f: CustomFee) =>
  `${f.name || "Sem nome"}: ${f.kind === "percent" ? percent(f.value) : brl(f.value)}`;

interface FieldSpec {
  key: keyof Product;
  label: string;
  kind: AuditKind;
  format: (v: never) => string;
}

const FIELDS: FieldSpec[] = [
  { key: "name", label: "Descrição do produto", kind: "parametro", format: (v: never) => String(v) },
  { key: "type", label: "Tipo do produto", kind: "parametro", format: (v: never) => String(v) },
  { key: "marginPct", label: "Margem alvo", kind: "parametro", format: percent as never },
  { key: "cardFeePct", label: "Taxa maquininha", kind: "parametro", format: percent as never },
  { key: "logisticsCost", label: "Logística", kind: "parametro", format: money as never },
  { key: "supplierPrice", label: "Preço do fornecedor", kind: "parametro", format: money as never },
  { key: "freight", label: "Frete de aquisição", kind: "parametro", format: money as never },
  { key: "purchaseTax", label: "Imposto de compra", kind: "parametro", format: money as never },
  { key: "laborMinutes", label: "Tempo de mão de obra (min)", kind: "parametro", format: num as never },
  {
    key: "laborCostPerMinute",
    label: "Custo mão de obra (R$/min)",
    kind: "parametro",
    format: money as never,
  },
  { key: "manualPrice", label: "Preço praticado (manual)", kind: "preco", format: money as never },
];

function itemsSignature(items: { name: string; quantity: number; unitCost: number }[]) {
  return items.map((i) => `${i.name || "Item"} (${i.quantity} × ${brl(i.unitCost)})`).join(", ") || "—";
}

/** Compara duas versões do produto e gera as entradas de auditoria */
export function diffProduct(
  before: Product,
  after: Product,
  user: string,
  reason: string,
): AuditEntry[] {
  const stamp = new Date().toISOString();
  const entries: AuditEntry[] = [];
  const push = (kind: AuditKind, field: string, b: string, a: string) => {
    if (b === a) return;
    entries.push({ id: uid(), productId: after.id, at: stamp, user, kind, field, before: b, after: a, reason });
  };

  for (const f of FIELDS) {
    push(f.kind, f.label, f.format(before[f.key] as never), f.format(after[f.key] as never));
  }

  push("parametro", "Ficha técnica (BOM)", itemsSignature(before.bom ?? []), itemsSignature(after.bom ?? []));
  push(
    "parametro",
    "Embalagens e brindes",
    itemsSignature(before.packaging ?? []),
    itemsSignature(after.packaging ?? []),
  );

  const beforeFees = before.customFees ?? [];
  const afterFees = after.customFees ?? [];
  for (const f of beforeFees) {
    const match = afterFees.find((x) => x.id === f.id);
    if (!match) push("parametro", `Taxa removida — ${f.name || "Sem nome"}`, feeLabel(f), "Removida");
    else push("parametro", `Taxa — ${match.name || f.name || "Sem nome"}`, feeLabel(f), feeLabel(match));
  }
  for (const f of afterFees) {
    if (!beforeFees.some((x) => x.id === f.id)) {
      push("parametro", `Taxa adicionada — ${f.name || "Sem nome"}`, "—", feeLabel(f));
    }
  }

  if (entries.length > 0) {
    push("preco", "Custo total", brl(totalCost(before)), brl(totalCost(after)));
    push("preco", "Preço sugerido", brl(suggestedPrice(before)), brl(suggestedPrice(after)));
    push("preco", "Preço final de venda", brl(finalPrice(before)), brl(finalPrice(after)));
  }

  return entries;
}

export function creationEntry(product: Product, user: string): AuditEntry {
  return {
    id: uid(),
    productId: product.id,
    at: new Date().toISOString(),
    user,
    kind: "parametro",
    field: "Cadastro do produto",
    before: "—",
    after: `${product.name} · ${brl(finalPrice(product))}`,
    reason: "Criação do produto no portfólio",
  };
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
