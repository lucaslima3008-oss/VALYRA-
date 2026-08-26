import { uid } from "./pricing";

export type PaymentMethod =
  | "pix"
  | "cartao_credito"
  | "cartao_debito"
  | "dinheiro"
  | "mercado_pago";

/** Status da cobrança online (Mercado Pago Checkout Pro). */
export type PaymentStatus = "pendente" | "pago" | "expirado" | "cancelado";

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pendente: "Aguardando pagamento",
  pago: "Pago",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

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

export const initialSales: Sale[] = [];

export const initialCashTransactions: CashTransaction[] = [];
