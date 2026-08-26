import React, { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Check,
  MessageCircle,
  QrCode,
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Printer,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { brl } from "@/lib/pricing";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getChargeStatus } from "@/lib/mercadopago.functions";
import { paymentStatusLabel, type PaymentStatus, type Sale } from "@/lib/sales";

export function PaymentStatusBadge({
  status,
  className,
}: {
  status?: PaymentStatus;
  className?: string;
}) {
  if (!status) return null;
  const tone =
    status === "pago"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : status === "pendente"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        tone,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {paymentStatusLabel[status]}
    </span>
  );
}

interface ChargeDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (saleCode: string, status: PaymentStatus) => void;
}

export function ChargeDialog({ sale, open, onOpenChange, onStatusChange }: ChargeDialogProps) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const link = sale?.paymentLink ?? "";
  const status: PaymentStatus = sale?.paymentStatus ?? "pendente";

  const refreshStatus = useCallback(async () => {
    if (!sale) return;
    setChecking(true);
    try {
      const res = await getChargeStatus({ data: { saleCode: sale.code } });
      if (res.found) onStatusChange(sale.code, res.status);
    } finally {
      setChecking(false);
    }
  }, [sale, onStatusChange]);

  // Realtime: o webhook atualiza a venda no banco e a tela reflete na hora.
  useEffect(() => {
    if (!open || !sale || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`venda-${sale.code}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "vendas", filter: `codigo=eq.${sale.code}` },
        (payload) => {
          const next = (payload.new as Record<string, unknown>)["status_pagamento"];
          if (typeof next === "string") onStatusChange(sale.code, next as PaymentStatus);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, sale, onStatusChange]);

  // Polling de segurança enquanto a cobrança estiver pendente.
  useEffect(() => {
    if (!open || !sale || status !== "pendente") return;
    const id = setInterval(() => void refreshStatus(), 15000);
    return () => clearInterval(id);
  }, [open, sale, status, refreshStatus]);

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  };

  const whatsappUrl = sale
    ? `https://wa.me/?text=${encodeURIComponent(
        `Olá! Segue o link para pagamento do pedido ${sale.code} no valor de ${brl(sale.total)}:\n${link}\n\nPagamento seguro via Mercado Pago.`,
      )}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5 text-indigo-600" />
            Cobrança gerada
          </DialogTitle>
          <DialogDescription>
            Pedido {sale?.code} · {sale ? brl(sale.total) : ""} · envie o link para o cliente pagar.
          </DialogDescription>
        </DialogHeader>

        {sale && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/50">
              <PaymentStatusBadge status={status} />
              <button
                onClick={() => void refreshStatus()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600"
              >
                {checking ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Atualizar status
              </button>
            </div>

            {link ? (
              <>
                <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800">
                  <QRCodeSVG value={link} size={168} level="M" includeMargin={false} />
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                  <span className="flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
                    {link}
                  </span>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void copyLink()}>
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    {copied ? "Copiado" : "Copiar link"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <Button className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                      <MessageCircle className="size-4" />
                      Enviar por WhatsApp
                    </Button>
                  </a>
                  <a href={link} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="size-4" />
                      Abrir checkout
                    </Button>
                  </a>
                </div>

                <Button
                  variant="ghost"
                  className="w-full gap-2 text-slate-500"
                  onClick={() => window.print()}
                >
                  <Printer className="size-4" />
                  Imprimir QR Code
                </Button>
              </>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                Nenhum link disponível para esta venda. Gere a cobrança novamente.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
