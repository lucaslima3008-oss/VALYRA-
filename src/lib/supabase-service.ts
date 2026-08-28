import { supabase, isSupabaseConfigured } from "./supabase";
import type { Product, BomItem, CustomFee } from "./pricing";
import type { InventoryItem, StockMovement, MovementType } from "./inventory";
import type { Sale, CashTransaction, PaymentStatus } from "./sales";
import type { AppUser } from "./users";
import type { AuditEntry } from "./audit";
import { mockProducts } from "./pricing";
import { initialInventory, initialMovements } from "./inventory";
import { initialSales, initialCashTransactions } from "./sales";
import { mockUsers } from "./users";

// Helpers seguros para SSR (Server-Side Rendering)
function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {}
}

// ==============================================================================
// 1. PRODUTOS E FICHA TÉCNICA
// ==============================================================================

export async function fetchSupabaseProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    const cached = safeGetItem("cost_price_products");
    return cached ? JSON.parse(cached) : mockProducts;
  }

  try {
    const { data: prodData, error: prodErr } = await supabase
      .from("produtos")
      .select("*")
      .order("created_at", { ascending: false });

    if (prodErr || !prodData || prodData.length === 0) {
      const cached = safeGetItem("cost_price_products");
      return cached ? JSON.parse(cached) : mockProducts;
    }

    const { data: itemsData } = await supabase.from("ficha_tecnica_itens").select("*");

    const products: Product[] = prodData.map((row) => {
      const items = (itemsData || []).filter((i) => i.produto_id === row.id);

      const bom: BomItem[] = items
        .filter((i) => i.tipo === "bom")
        .map((i) => ({
          id: i.id,
          name: i.nome,
          quantity: Number(i.quantidade),
          unitCost: Number(i.unit_cost),
        }));

      const packaging: BomItem[] = items
        .filter((i) => i.tipo === "packaging")
        .map((i) => ({
          id: i.id,
          name: i.nome,
          quantity: Number(i.quantidade),
          unitCost: Number(i.unit_cost),
        }));

      const customFees: CustomFee[] = items
        .filter((i) => i.tipo === "custom_fee")
        .map((i) => ({
          id: i.id,
          name: i.nome,
          kind: i.fee_kind || "percent",
          value: Number(i.fee_value),
        }));

      return {
        id: row.id,
        name: row.nome,
        type: row.tipo,
        bom,
        laborMinutes: Number(row.labor_minutes || 0),
        laborCostPerMinute: Number(row.labor_cost_per_minute || 0),
        supplierPrice: Number(row.supplier_price || 0),
        freight: Number(row.freight || 0),
        purchaseTax: Number(row.purchase_tax || 0),
        packaging,
        marginPct: Number(row.margin_pct || 25),
        cardFeePct: Number(row.card_fee_pct || 3.5),
        logisticsCost: Number(row.logistics_cost || 0),
        customFees,
        manualPrice: row.manual_price ? Number(row.manual_price) : null,
      };
    });

    safeSetItem("cost_price_products", JSON.stringify(products));
    return products;
  } catch (err) {
    console.error("Erro ao buscar produtos no Supabase:", err);
    const cached = safeGetItem("cost_price_products");
    return cached ? JSON.parse(cached) : mockProducts;
  }
}

export async function saveSupabaseProduct(product: Product): Promise<void> {
  const current = safeGetItem("cost_price_products");
  const list: Product[] = current ? JSON.parse(current) : mockProducts;
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx >= 0) list[idx] = product;
  else list.unshift(product);
  safeSetItem("cost_price_products", JSON.stringify(list));

  if (!isSupabaseConfigured) return;

  try {
    const { error: prodErr } = await supabase.from("produtos").upsert({
      id: product.id.length > 20 ? product.id : undefined,
      nome: product.name,
      tipo: product.type,
      labor_minutes: product.laborMinutes,
      labor_cost_per_minute: product.laborCostPerMinute,
      supplier_price: product.supplierPrice,
      freight: product.freight,
      purchase_tax: product.purchaseTax,
      margin_pct: product.marginPct,
      card_fee_pct: product.cardFeePct,
      logistics_cost: product.logisticsCost,
      manual_price: product.manualPrice,
      updated_at: new Date().toISOString(),
    });

    if (prodErr) console.error("Erro ao salvar produto no Supabase:", prodErr);

    if (product.id.length > 20) {
      await supabase.from("ficha_tecnica_itens").delete().eq("produto_id", product.id);

      const itemsToInsert = [
        ...product.bom.map((b) => ({
          produto_id: product.id,
          tipo: "bom",
          nome: b.name,
          quantidade: b.quantity,
          unit_cost: b.unitCost,
        })),
        ...product.packaging.map((p) => ({
          produto_id: product.id,
          tipo: "packaging",
          nome: p.name,
          quantidade: p.quantity,
          unit_cost: p.unitCost,
        })),
        ...product.customFees.map((c) => ({
          produto_id: product.id,
          tipo: "custom_fee",
          nome: c.name,
          fee_kind: c.kind,
          fee_value: c.value,
        })),
      ];

      if (itemsToInsert.length > 0) {
        await supabase.from("ficha_tecnica_itens").insert(itemsToInsert);
      }
    }
  } catch (err) {
    console.error("Exceção ao persistir produto:", err);
  }
}

export async function deleteSupabaseProduct(productId: string): Promise<void> {
  const current = safeGetItem("cost_price_products");
  if (current) {
    const list: Product[] = JSON.parse(current);
    safeSetItem("cost_price_products", JSON.stringify(list.filter((p) => p.id !== productId)));
  }

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from("produtos").delete().eq("id", productId);
  } catch (err) {
    console.error("Erro ao deletar produto no Supabase:", err);
  }
}

// ==============================================================================
// 2. ESTOQUE E MOVIMENTAÇÕES
// ==============================================================================

export async function fetchSupabaseInventory(): Promise<InventoryItem[]> {
  if (!isSupabaseConfigured) {
    const cached = safeGetItem("cost_price_inventory");
    return cached ? JSON.parse(cached) : initialInventory;
  }

  try {
    const { data, error } = await supabase.from("estoque").select("*").order("nome");
    if (error || !data || data.length === 0) {
      const cached = safeGetItem("cost_price_inventory");
      return cached ? JSON.parse(cached) : initialInventory;
    }

    const items: InventoryItem[] = data.map((row) => ({
      id: row.id,
      productId: row.produto_id,
      name: row.nome,
      type: row.tipo,
      currentStock: Number(row.saldo_atual),
      minStock: Number(row.saldo_minimo),
      unit: row.unidade,
      unitCost: Number(row.custo_unitario),
      lastUpdated: row.updated_at,
    }));

    safeSetItem("cost_price_inventory", JSON.stringify(items));
    return items;
  } catch (err) {
    console.error("Erro ao buscar estoque no Supabase:", err);
    const cached = safeGetItem("cost_price_inventory");
    return cached ? JSON.parse(cached) : initialInventory;
  }
}

export async function saveSupabaseInventoryItem(item: InventoryItem): Promise<void> {
  const cached = safeGetItem("cost_price_inventory");
  const list: InventoryItem[] = cached ? JSON.parse(cached) : initialInventory;
  const idx = list.findIndex((i) => i.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
  safeSetItem("cost_price_inventory", JSON.stringify(list));

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from("estoque").upsert({
      id: item.id.length > 20 ? item.id : undefined,
      produto_id: item.productId && item.productId.length > 20 ? item.productId : null,
      nome: item.name,
      tipo: item.type,
      saldo_atual: item.currentStock,
      saldo_minimo: item.minStock,
      unidade: item.unit,
      custo_unitario: item.unitCost,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Erro ao salvar item de estoque:", err);
  }
}

export async function fetchSupabaseMovements(): Promise<StockMovement[]> {
  if (!isSupabaseConfigured) {
    const cached = safeGetItem("cost_price_movements");
    return cached ? JSON.parse(cached) : initialMovements;
  }

  try {
    const { data, error } = await supabase
      .from("movimentacoes_estoque")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      const cached = safeGetItem("cost_price_movements");
      return cached ? JSON.parse(cached) : initialMovements;
    }

    const movs: StockMovement[] = data.map((row) => ({
      id: row.id,
      itemId: row.item_id,
      itemName: row.item_nome,
      type: row.tipo as MovementType,
      quantity: Number(row.quantidade),
      balanceAfter: Number(row.saldo_apos),
      reason: row.motivo,
      date: row.created_at,
      user: row.usuario,
    }));

    safeSetItem("cost_price_movements", JSON.stringify(movs));
    return movs;
  } catch (err) {
    console.error("Erro ao buscar movimentações:", err);
    const cached = safeGetItem("cost_price_movements");
    return cached ? JSON.parse(cached) : initialMovements;
  }
}

export async function recordSupabaseMovement(movement: StockMovement): Promise<void> {
  const cached = safeGetItem("cost_price_movements");
  const list: StockMovement[] = cached ? JSON.parse(cached) : initialMovements;
  list.unshift(movement);
  safeSetItem("cost_price_movements", JSON.stringify(list));

  if (!isSupabaseConfigured) return;

  try {
    if (movement.itemId.length > 20) {
      await supabase.from("movimentacoes_estoque").insert({
        item_id: movement.itemId,
        item_nome: movement.itemName,
        tipo: movement.type,
        quantidade: movement.quantity,
        saldo_apos: movement.balanceAfter,
        motivo: movement.reason,
        usuario: movement.user,
      });
    }
  } catch (err) {
    console.error("Erro ao registrar movimentação de estoque:", err);
  }
}

// ==============================================================================
// 3. VENDAS (PDV) E ITENS
// ==============================================================================

export async function fetchSupabaseSales(): Promise<Sale[]> {
  if (!isSupabaseConfigured) {
    const cached = safeGetItem("cost_price_sales");
    return cached ? JSON.parse(cached) : initialSales;
  }

  try {
    const { data: salesData, error: salesErr } = await supabase
      .from("vendas")
      .select("*")
      .order("created_at", { ascending: false });

    if (salesErr || !salesData || salesData.length === 0) {
      const cached = safeGetItem("cost_price_sales");
      return cached ? JSON.parse(cached) : initialSales;
    }

    const { data: itemsData } = await supabase.from("itens_venda").select("*");

    const sales: Sale[] = salesData.map((row) => {
      const items = (itemsData || []).filter((i) => i.venda_id === row.id);
      return {
        id: row.id,
        code: row.codigo,
        items: items.map((i) => ({
          productId: i.produto_id,
          name: i.nome,
          quantity: Number(i.quantidade),
          unitPrice: Number(i.preco_unitario),
          unitCost: Number(i.custo_unitario),
          subtotal: Number(i.subtotal),
        })),
        subtotal: Number(row.subtotal),
        discount: Number(row.desconto),
        total: Number(row.total),
        paymentMethod: row.forma_pagamento,
        cardFeePct: Number(row.taxa_cartao_pct),
        cardFeeAmount: Number(row.valor_taxa_cartao),
        netRevenue: Number(row.receita_liquida),
        totalCost: Number(row.custo_total),
        grossProfit: Number(row.lucro_bruto),
        marginRealizedPct: Number(row.margem_realizada_pct),
        user: row.usuario,
        date: row.created_at,
        paymentStatus: (row.status_pagamento ?? undefined) as PaymentStatus | undefined,
        preferenceId: row.mp_preference_id ?? undefined,
        paymentLink: row.mp_link_pagamento ?? undefined,
      };
    });

    safeSetItem("cost_price_sales", JSON.stringify(sales));
    return sales;
  } catch (err) {
    console.error("Erro ao buscar vendas no Supabase:", err);
    const cached = safeGetItem("cost_price_sales");
    return cached ? JSON.parse(cached) : initialSales;
  }
}

export async function saveSupabaseSale(sale: Sale): Promise<void> {
  const cached = safeGetItem("cost_price_sales");
  const list: Sale[] = cached ? JSON.parse(cached) : initialSales;
  list.unshift(sale);
  safeSetItem("cost_price_sales", JSON.stringify(list));

  if (!isSupabaseConfigured) return;

  try {
    const { data: createdSale, error: saleErr } = await supabase
      .from("vendas")
      .insert({
        codigo: sale.code,
        subtotal: sale.subtotal,
        desconto: sale.discount,
        total: sale.total,
        forma_pagamento: sale.paymentMethod,
        taxa_cartao_pct: sale.cardFeePct,
        valor_taxa_cartao: sale.cardFeeAmount,
        receita_liquida: sale.netRevenue,
        custo_total: sale.totalCost,
        lucro_bruto: sale.grossProfit,
        margem_realizada_pct: sale.marginRealizedPct,
        usuario: sale.user,
        status_pagamento: sale.paymentStatus ?? null,
        mp_preference_id: sale.preferenceId ?? null,
        mp_link_pagamento: sale.paymentLink ?? null,
      })
      .select()
      .single();

    if (saleErr || !createdSale) {
      console.error("Erro ao registrar venda no Supabase:", saleErr);
      return;
    }

    const itemsToInsert = sale.items.map((i) => ({
      venda_id: createdSale.id,
      produto_id: i.productId.length > 20 ? i.productId : null,
      nome: i.name,
      quantidade: i.quantity,
      preco_unitario: i.unitPrice,
      custo_unitario: i.unitCost,
      subtotal: i.subtotal,
    }));

    await supabase.from("itens_venda").insert(itemsToInsert);
  } catch (err) {
    console.error("Exceção ao salvar venda no Supabase:", err);
  }
}

/** Atualiza o status da cobrança online de uma venda (Mercado Pago). */
export async function updateSupabaseSalePayment(
  saleCode: string,
  status: PaymentStatus,
): Promise<void> {
  const cached = safeGetItem("cost_price_sales");
  const list: Sale[] = cached ? JSON.parse(cached) : initialSales;
  safeSetItem(
    "cost_price_sales",
    JSON.stringify(list.map((s) => (s.code === saleCode ? { ...s, paymentStatus: status } : s))),
  );

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from("vendas").update({ status_pagamento: status }).eq("codigo", saleCode);
  } catch (err) {
    console.error("Erro ao atualizar status de pagamento:", err);
  }
}

// ==============================================================================
// 4. FLUXO DE CAIXA
// ==============================================================================

export async function fetchSupabaseCashflow(): Promise<CashTransaction[]> {
  if (!isSupabaseConfigured) {
    const cached = safeGetItem("cost_price_cashflow");
    return cached ? JSON.parse(cached) : initialCashTransactions;
  }

  try {
    const { data, error } = await supabase
      .from("fluxo_caixa")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      const cached = safeGetItem("cost_price_cashflow");
      return cached ? JSON.parse(cached) : initialCashTransactions;
    }

    const txs: CashTransaction[] = data.map((row) => ({
      id: row.id,
      type: row.tipo,
      category: row.categoria,
      description: row.descricao,
      amount: Number(row.valor),
      date: row.created_at,
      user: row.usuario,
      saleId: row.venda_id,
    }));

    safeSetItem("cost_price_cashflow", JSON.stringify(txs));
    return txs;
  } catch (err) {
    console.error("Erro ao buscar fluxo de caixa:", err);
    const cached = safeGetItem("cost_price_cashflow");
    return cached ? JSON.parse(cached) : initialCashTransactions;
  }
}

export async function saveSupabaseCashTransaction(tx: CashTransaction): Promise<void> {
  const cached = safeGetItem("cost_price_cashflow");
  const list: CashTransaction[] = cached ? JSON.parse(cached) : initialCashTransactions;
  list.unshift(tx);
  safeSetItem("cost_price_cashflow", JSON.stringify(list));

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from("fluxo_caixa").insert({
      tipo: tx.type,
      categoria: tx.category,
      descricao: tx.description,
      valor: tx.amount,
      usuario: tx.user,
      venda_id: tx.saleId && tx.saleId.length > 20 ? tx.saleId : null,
    });
  } catch (err) {
    console.error("Erro ao salvar transação de caixa:", err);
  }
}

// ==============================================================================
// 5. USUÁRIOS
// ==============================================================================

export async function fetchSupabaseUsers(): Promise<AppUser[]> {
  if (!isSupabaseConfigured) {
    const cached = safeGetItem("cost_price_users");
    return cached ? JSON.parse(cached) : mockUsers;
  }

  try {
    const { data, error } = await supabase.from("usuarios").select("*").order("nome");
    if (error || !data || data.length === 0) {
      const cached = safeGetItem("cost_price_users");
      return cached ? JSON.parse(cached) : mockUsers;
    }

    const users: AppUser[] = data.map((row) => ({
      id: row.id,
      name: row.nome,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    }));

    safeSetItem("cost_price_users", JSON.stringify(users));
    return users;
  } catch (err) {
    console.error("Erro ao buscar usuários no Supabase:", err);
    const cached = safeGetItem("cost_price_users");
    return cached ? JSON.parse(cached) : mockUsers;
  }
}

export async function saveSupabaseUser(user: AppUser): Promise<void> {
  const cached = safeGetItem("cost_price_users");
  const list: AppUser[] = cached ? JSON.parse(cached) : mockUsers;
  const idx = list.findIndex((u) => u.id === user.id);
  if (idx >= 0) list[idx] = user;
  else list.unshift(user);
  safeSetItem("cost_price_users", JSON.stringify(list));

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from("usuarios").upsert({
      id: user.id.length > 20 ? user.id : undefined,
      nome: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  } catch (err) {
    console.error("Erro ao salvar usuário no Supabase:", err);
  }
}

export async function deleteSupabaseUser(userId: string): Promise<void> {
  const cached = safeGetItem("cost_price_users");
  if (cached) {
    const list: AppUser[] = JSON.parse(cached);
    safeSetItem("cost_price_users", JSON.stringify(list.filter((u) => u.id !== userId)));
  }

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from("usuarios").delete().eq("id", userId);
  } catch (err) {
    console.error("Erro ao deletar usuário no Supabase:", err);
  }
}

// ==============================================================================
// 6. HISTÓRICO DE AUDITORIA
// ==============================================================================

export async function fetchSupabaseAudit(): Promise<AuditEntry[]> {
  if (!isSupabaseConfigured) {
    const cached = safeGetItem("cost_price_audit");
    return cached ? JSON.parse(cached) : [];
  }

  try {
    const { data, error } = await supabase
      .from("historico_auditoria")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      const cached = safeGetItem("cost_price_audit");
      return cached ? JSON.parse(cached) : [];
    }

    const logs: AuditEntry[] = data.map((row) => ({
      id: row.id,
      productId: row.produto_id || "",
      at: row.created_at,
      user: row.usuario,
      kind: row.tipo,
      field: row.campo,
      before: row.antes || "",
      after: row.depois || "",
      reason: row.motivo || "",
    }));

    safeSetItem("cost_price_audit", JSON.stringify(logs));
    return logs;
  } catch (err) {
    console.error("Erro ao buscar histórico de auditoria:", err);
    const cached = safeGetItem("cost_price_audit");
    return cached ? JSON.parse(cached) : [];
  }
}

export async function recordSupabaseAudit(entry: AuditEntry): Promise<void> {
  const cached = safeGetItem("cost_price_audit");
  const list: AuditEntry[] = cached ? JSON.parse(cached) : [];
  list.unshift(entry);
  safeSetItem("cost_price_audit", JSON.stringify(list));

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from("historico_auditoria").insert({
      produto_id: entry.productId && entry.productId.length > 20 ? entry.productId : null,
      usuario: entry.user,
      tipo: entry.kind,
      campo: entry.field,
      antes: entry.before,
      depois: entry.after,
      motivo: entry.reason,
    });
  } catch (err) {
    console.error("Erro ao salvar log de auditoria no Supabase:", err);
  }
}
