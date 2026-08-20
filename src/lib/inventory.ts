import { uid, mockProducts, type Product } from "./pricing";

export type StockItemType = "produto_final" | "insumo";
export type MovementType = "entrada" | "saida" | "ajuste" | "venda";

export interface InventoryItem {
  id: string;
  productId?: string; // associado a um produto de precificação, se for produto final
  name: string;
  type: StockItemType;
  currentStock: number;
  minStock: number;
  unit: string;
  unitCost: number;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: MovementType;
  quantity: number;
  balanceAfter: number;
  reason: string;
  date: string;
  user: string;
}

export const initialInventory: InventoryItem[]] = [];

export const initialMovements: StockMovement[]] = [];
