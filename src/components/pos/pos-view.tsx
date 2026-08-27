import React, { useState, useMemo } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  CheckCircle2,
  Search,
  Percent,
  Layers,
  ArrowRight,
  Link2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { brl, pct, finalPrice, totalCost, type Product } from "@/lib/pricing";
import { formatDateTime } from "@/lib/audit";
import type { Sale, PaymentMethod, SaleItem, PaymentStatus } from "@/lib/sales";
import type { InventoryItem } from "@/lib/inventory";
import { uid } from "@/lib/pricing";
import { createCharge } from "@/lib/mercadopago.functions";
import { ChargeDialog, PaymentStatusBadge } from "@/components/pos/charge-dialog";

interface PosViewProps {
  products: Product[];
  inventory: InventoryItem[];
  sales: Sale[];
  currentUserName: string;
  onCompleteSale: (sale: Sale) => void;
  onUpdateSaleStatus: (saleCode: string, status: PaymentStatus) => void;
}

export function PosView({
  products,
  inventory,
  sales,
  currentUserName,
  onCompleteSale,
  onUpdateSaleStatus,
}: PosViewProps) {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "fabricado" | "revenda">("todos");
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [discount, setDiscount] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [successSale, setSuccessSale] = useState<Sale | null>(null);
  const [recentSalesOpen, setRecentSalesOpen] = useState(false);
  const [chargeSale, setChargeSale] = useState<Sale | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchQuery = p.name.toLowerCase().includes(query.toLowerCase());
      const matchType = filterType === "todos" || p.type === filterType;
      return matchQuery && matchType;
    });
  }, [products, query, filterType]);

  // Inventory lookup helper
  const getProductStock = (prodId: string) => {
    const item = inventory.find((i) => i.productId === prodId || i.name === prodId);
    return item ? item.currentStock : null;
  };

  // Cart actions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[],
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount("0");
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + finalPrice(item.product) * item.quantity, 0);
  }, [cart]);

  const discountValue = Math.min(parseFloat(discount) || 0, subtotal);
  const total = Math.max(0, subtotal - discountValue);

  const cardFeePct = useMemo(() => {
    if (paymentMethod === "cartao_credito") return 3.99;
    if (paymentMethod === "cartao_debito") return 1.99;
    return 0;
  }, [paymentMethod]);

  const cardFeeAmount = (total * cardFeePct) / 100;
  const netRevenue = total - cardFeeAmount;

  const totalCostValue = useMemo(() => {
    return cart.reduce((sum, item) => sum + totalCost(item.product) * item.quantity, 0);
  }, [cart]);

  const grossProfit = netRevenue - totalCostValue;
  const realizedMargin = total > 0 ? (grossProfit / total) * 100 : 0;

  const buildSale = (method: PaymentMethod, extra: Partial<Sale> = {}): Sale => {
    const saleItems: SaleItem[] = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: finalPrice(item.product),
      unitCost: totalCost(item.product),
      subtotal: finalPrice(item.product) * item.quantity,
    }));

    const saleCode = `VND-${new Date().getFullYear()}-${String(sales.length + 1).padStart(3, "0")}`;
    const fee = method === "mercado_pago" ? 0 : cardFeePct;
    const feeAmount = (total * fee) / 100;

    return {
      id: uid(),
      code: saleCode,
      items: saleItems,
      subtotal,
      discount: discountValue,
      total,
      paymentMethod: method,
      cardFeePct: fee,
      cardFeeAmount: feeAmount,
      netRevenue: total - feeAmount,
      totalCost: totalCostValue,
      grossProfit: total - feeAmount - totalCostValue,
      marginRealizedPct: total > 0 ? ((total - feeAmount - totalCostValue) / total) * 100 : 0,
      user: currentUserName,
      date: new Date().toISOString(),
      ...extra,
    };
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const newSale = buildSale(paymentMethod);
    onCompleteSale(newSale);
    setSuccessSale(newSale);
    clearCart();
  };

  /** Gera a cobrança no Mercado Pago (Checkout Pro) sem processar cartão aqui. */
  const handleGenerateCharge = async () => {
    if (cart.length === 0 || generating) return;
    setChargeError(null);
    setGenerating(true);

    const pendingSale = buildSale("mercado_pago", { paymentStatus: "pendente" });

    try {
      const res = await createCharge({
        data: {
          saleCode: pendingSale.code,
          items: cart.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: finalPrice(item.product),
          })),
          discount: discountValue,
        },
      });

      if (!res.ok) {
        setChargeError(res.error);
        return;
      }

      const saleWithLink: Sale = {
        ...pendingSale,
        paymentLink: res.initPoint,
        preferenceId: res.preferenceId,
      };

      onCompleteSale(saleWithLink);
      setChargeSale(saleWithLink);
      setChargeOpen(true);
      clearCart();
    } catch (err) {
      setChargeError(err instanceof Error ? err.message : "Falha ao gerar cobrança.");
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = (saleCode: string, status: PaymentStatus) => {
    setChargeSale((prev) => (prev && prev.code === saleCode ? { ...prev, paymentStatus: status } : prev));
    onUpdateSaleStatus(saleCode, status);
  };

  const openCharge = (sale: Sale) => {
    setChargeSale(sale);
    setChargeOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Frente de Caixa (PDV)
          </h2>
          <p className="text-sm text-slate-500">
            Ponto de venda ágil com cálculo de taxas de pagamento e baixa automática de estoque.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setRecentSalesOpen(true)}
          className="gap-2 border-slate-300 dark:border-slate-700"
        >
          <Receipt className="size-4 text-slate-500" />
          Histórico de Vendas ({sales.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Product Catalog (7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-64 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9 bg-white dark:bg-slate-900"
                placeholder="Buscar produto para adicionar ao pedido..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => setFilterType("todos")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  filterType === "todos"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType("fabricado")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  filterType === "fabricado"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                )}
              >
                Fabricados
              </button>
              <button
                onClick={() => setFilterType("revenda")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  filterType === "revenda"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                )}
              >
                Revenda
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredProducts.map((p) => {
              const price = finalPrice(p);
              const cost = totalCost(p);
              const stock = getProductStock(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          p.type === "fabricado"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        )}
                      >
                        {p.type === "fabricado" ? "Fabricado" : "Revenda"}
                      </span>
                      {stock !== null && (
                        <span
                          className={cn(
                            "text-[11px] font-medium tabular-nums",
                            stock <= 3
                              ? "text-rose-500 font-semibold"
                              : "text-slate-500",
                          )}
                        >
                          Estoque: {stock} un
                        </span>
                      )}
                    </div>

                    <h4 className="mt-2 font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400">Preço de Venda</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                        {brl(price)}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="size-8 rounded-full p-0 bg-indigo-600 text-white hover:bg-indigo-700 group-hover:scale-105 transition-transform"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Order Cart & Checkout (5 Cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Carrinho Atual</h3>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {cart.reduce((s, i) => s + i.quantity, 0)} itens
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-medium text-rose-600 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="my-4 max-h-[300px] overflow-y-auto space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingCart className="mx-auto size-8 text-slate-300 dark:text-slate-700" />
                  <p className="mt-2 text-sm text-slate-400">O carrinho está vazio.</p>
                  <p className="text-xs text-slate-400">Clique nos produtos para adicionar.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-2.5 first:pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {item.product.name}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="flex size-6 items-center justify-center rounded text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="flex size-6 items-center justify-center rounded text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400">
                          {item.quantity} × {brl(finalPrice(item.product))}
                        </span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                          {brl(finalPrice(item.product) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2 text-xs font-semibold transition-all",
                    paymentMethod === "pix"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "border-slate-200 text-slate-600 dark:border-slate-800",
                  )}
                >
                  <QrCode className="size-4 text-emerald-500" />
                  PIX (0% taxa)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cartao_credito")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2 text-xs font-semibold transition-all",
                    paymentMethod === "cartao_credito"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-slate-200 text-slate-600 dark:border-slate-800",
                  )}
                >
                  <CreditCard className="size-4 text-indigo-500" />
                  Crédito (3.99%)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cartao_debito")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2 text-xs font-semibold transition-all",
                    paymentMethod === "cartao_debito"
                      ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
                      : "border-slate-200 text-slate-600 dark:border-slate-800",
                  )}
                >
                  <CreditCard className="size-4 text-cyan-500" />
                  Débito (1.99%)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("dinheiro")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2 text-xs font-semibold transition-all",
                    paymentMethod === "dinheiro"
                      ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      : "border-slate-200 text-slate-600 dark:border-slate-800",
                  )}
                >
                  <Banknote className="size-4 text-amber-500" />
                  Dinheiro
                </button>
              </div>
            </div>

            {/* Discount and Summary */}
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {brl(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Desconto (R$):</span>
                <input
                  type="number"
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-20 rounded border border-slate-200 px-2 py-0.5 text-right font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {cardFeeAmount > 0 && (
                <div className="flex items-center justify-between text-slate-500">
                  <span>Taxa Cartão ({cardFeePct}%):</span>
                  <span className="text-rose-500 tabular-nums">-{brl(cardFeeAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Total a Pagar:
                </span>
                <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {brl(total)}
                </span>
              </div>

              {cart.length > 0 && (
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <div className="flex justify-between font-medium">
                    <span>Lucro Bruto Estimado:</span>
                    <span className="font-bold">{brl(grossProfit)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span>Margem Realizada:</span>
                    <span>{pct(realizedMargin)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout Button */}
            <Button
              size="lg"
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className="mt-4 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-base font-semibold"
            >
              <CheckCircle2 className="size-5" />
              Finalizar Venda &amp; Baixar Estoque
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Sucesso / Recibo */}
      <Dialog open={!!successSale} onOpenChange={(o) => !o && setSuccessSale(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-center text-lg mt-2">Venda Concluída com Sucesso!</DialogTitle>
            <DialogDescription className="text-center">
              Comprovante {successSale?.code} · Baixa de estoque efetuada automaticamente.
            </DialogDescription>
          </DialogHeader>

          {successSale && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Data / Hora:</span>
                <span className="font-medium">{formatDateTime(successSale.date)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Operador:</span>
                <span className="font-medium">{successSale.user}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Forma de Pagamento:</span>
                <span className="font-semibold uppercase">{successSale.paymentMethod}</span>
              </div>

              <div className="py-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Itens:</p>
                <div className="mt-1 space-y-1">
                  {successSale.items.map((i) => (
                    <div key={i.productId} className="flex justify-between">
                      <span>
                        {i.quantity}x {i.name}
                      </span>
                      <span className="font-medium tabular-nums">{brl(i.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between border-t pt-2 text-sm font-bold text-slate-900 dark:text-white">
                <span>Total Recebido:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{brl(successSale.total)}</span>
              </div>
            </div>
          )}

          <Button
            onClick={() => setSuccessSale(null)}
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Concluir &amp; Próxima Venda
          </Button>
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico de Vendas */}
      <Dialog open={recentSalesOpen} onOpenChange={setRecentSalesOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Histórico Geral de Vendas</DialogTitle>
            <DialogDescription>
              Lista de todas as vendas processadas com faturamento e margens líquidas.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 dark:bg-slate-950 dark:border-slate-800">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Código</th>
                  <th className="px-3 py-2.5">Data/Hora</th>
                  <th className="px-3 py-2.5">Itens</th>
                  <th className="px-3 py-2.5">Pagamento</th>
                  <th className="px-3 py-2.5 text-right">Valor Bruto</th>
                  <th className="px-3 py-2.5 text-right">Lucro Bruto</th>
                  <th className="px-3 py-2.5 text-right">Margem</th>
                  <th className="px-3 py-2.5">Atendente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 font-bold text-indigo-600">{s.code}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500 tabular-nums">
                      {formatDateTime(s.date)}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {s.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {brl(s.total)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-600 tabular-nums">
                      {brl(s.grossProfit)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {pct(s.marginRealizedPct)}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{s.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
