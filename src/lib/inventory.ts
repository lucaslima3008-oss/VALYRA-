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

export const initialInventory: InventoryItem[] = [
  // Produtos Finais
  {
    id: "inv-p1",
    productId: "p1",
    name: "Bolo de Cenoura Premium 1,2kg",
    type: "produto_final",
    currentStock: 14,
    minStock: 5,
    unit: "un",
    unitCost: 15.65,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-p2",
    productId: "p2",
    name: "Kit Presente Corporativo",
    type: "produto_final",
    currentStock: 4,
    minStock: 8,
    unit: "un",
    unitCost: 36.56,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-p3",
    productId: "p3",
    name: "Café Especial Torrado 500g",
    type: "produto_final",
    currentStock: 28,
    minStock: 10,
    unit: "un",
    unitCost: 35.55,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-p4",
    productId: "p4",
    name: "Garrafa Térmica Inox 1L",
    type: "produto_final",
    currentStock: 2,
    minStock: 6,
    unit: "un",
    unitCost: 90.6,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-p5",
    productId: "p5",
    name: "Linha Artesanal — Vela de Soja 180g",
    type: "produto_final",
    currentStock: 19,
    minStock: 5,
    unit: "un",
    unitCost: 24.82,
    lastUpdated: new Date().toISOString(),
  },
  // Insumos e Embalagens
  {
    id: "inv-ins-1",
    name: "Cenoura orgânica",
    type: "insumo",
    currentStock: 18.5,
    minStock: 5.0,
    unit: "kg",
    unitCost: 8.9,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-ins-2",
    name: "Farinha de trigo",
    type: "insumo",
    currentStock: 35.0,
    minStock: 10.0,
    unit: "kg",
    unitCost: 5.4,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-ins-3",
    name: "Cobertura de chocolate",
    type: "insumo",
    currentStock: 8.2,
    minStock: 3.0,
    unit: "kg",
    unitCost: 32.0,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-ins-4",
    name: "Caneca cerâmica",
    type: "insumo",
    currentStock: 12,
    minStock: 15,
    unit: "un",
    unitCost: 14.2,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-ins-5",
    name: "Cera de soja",
    type: "insumo",
    currentStock: 6.4,
    minStock: 2.0,
    unit: "kg",
    unitCost: 42.0,
    lastUpdated: new Date().toISOString(),
  },
];

export const initialMovements: StockMovement[] = [
  {
    id: uid(),
    itemId: "inv-p1",
    itemName: "Bolo de Cenoura Premium 1,2kg",
    type: "entrada",
    quantity: 10,
    balanceAfter: 14,
    reason: "Lote de produção concluído #041",
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    user: "Ana Souza",
  },
  {
    id: uid(),
    itemId: "inv-p3",
    itemName: "Café Especial Torrado 500g",
    type: "entrada",
    quantity: 20,
    balanceAfter: 28,
    reason: "Recebimento NF-e #4489",
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
    user: "Carlos Mendes",
  },
  {
    id: uid(),
    itemId: "inv-p4",
    itemName: "Garrafa Térmica Inox 1L",
    type: "saida",
    quantity: 3,
    balanceAfter: 2,
    reason: "Ajuste por avaria no transporte",
    date: new Date(Date.now() - 3600000 * 48).toISOString(),
    user: "Ana Souza",
  },
];
