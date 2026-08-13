import { uid } from "./pricing";

export type PaymentMethod = "pix" | "cartao_credito" | "cartao_debito" | "dinheiro";

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  code: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cardFeePct: number;
  cardFeeAmount: number;
  netRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginRealizedPct: number;
  user: string;
  date: string;
}

export type TransactionType = "entrada" | "saida";

export interface CashTransaction {
  id: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  date: string;
  user: string;
  saleId?: string;
}

export const initialSales: Sale[] = [
  {
    id: "sale-101",
    code: "VND-2026-001",
    items: [
      {
        productId: "p1",
        name: "Bolo de Cenoura Premium 1,2kg",
        quantity: 2,
        unitPrice: 85.0,
        unitCost: 15.65,
        subtotal: 170.0,
      },
    ],
    subtotal: 170.0,
    discount: 0,
    total: 170.0,
    paymentMethod: "cartao_credito",
    cardFeePct: 3.99,
    cardFeeAmount: 6.78,
    netRevenue: 163.22,
    totalCost: 31.3,
    grossProfit: 131.92,
    marginRealizedPct: 77.6,
    user: "Ana Souza",
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "sale-102",
    code: "VND-2026-002",
    items: [
      {
        productId: "p3",
        name: "Café Especial Torrado 500g",
        quantity: 3,
        unitPrice: 68.0,
        unitCost: 35.55,
        subtotal: 204.0,
      },
      {
        productId: "p5",
        name: "Linha Artesanal — Vela de Soja 180g",
        quantity: 1,
        unitPrice: 58.0,
        unitCost: 24.82,
        subtotal: 58.0,
      },
    ],
    subtotal: 262.0,
    discount: 12.0,
    total: 250.0,
    paymentMethod: "pix",
    cardFeePct: 0,
    cardFeeAmount: 0,
    netRevenue: 250.0,
    totalCost: 131.47,
    grossProfit: 118.53,
    marginRealizedPct: 47.4,
    user: "Carlos Mendes",
    date: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

export const initialCashTransactions: CashTransaction[] = [
  {
    id: "tx-1",
    type: "entrada",
    category: "Venda PDV",
    description: "Venda VND-2026-001 (Cartão Crédito)",
    amount: 163.22,
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: "Ana Souza",
    saleId: "sale-101",
  },
  {
    id: "tx-2",
    type: "entrada",
    category: "Venda PDV",
    description: "Venda VND-2026-002 (PIX)",
    amount: 250.0,
    date: new Date(Date.now() - 3600000 * 6).toISOString(),
    user: "Carlos Mendes",
    saleId: "sale-102",
  },
  {
    id: "tx-3",
    type: "saida",
    category: "Insumos & Matéria-Prima",
    description: "Compra de sacas de farinha e cera de soja",
    amount: 380.0,
    date: new Date(Date.now() - 3600000 * 20).toISOString(),
    user: "Ana Souza",
  },
  {
    id: "tx-4",
    type: "saida",
    category: "Despesas Operacionais",
    description: "Frete de entrega de embalagens",
    amount: 65.0,
    date: new Date(Date.now() - 3600000 * 30).toISOString(),
    user: "Carlos Mendes",
  },
];
