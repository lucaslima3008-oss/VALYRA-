import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook do Mercado Pago (notification_url).
 * Recebe a notificação, consulta a API para confirmar o status real do
 * pagamento e atualiza a venda (baixa de estoque + fluxo de caixa se aprovado).
 */
export const Route = createFileRoute("/api/public/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const mp = await import("@/lib/mercadopago.server");
        if (!(await mp.hasAccessTokenAsync()))
          return new Response("not configured", { status: 200 });

        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          body = {};
        }

        const url = new URL(request.url);
        const type = String(body["type"] ?? body["topic"] ?? url.searchParams.get("type") ?? "");
        const dataObj = (body["data"] ?? {}) as Record<string, unknown>;
        const paymentId = String(
          dataObj["id"] ??
            body["id"] ??
            url.searchParams.get("data.id") ??
            url.searchParams.get("id") ??
            "",
        );

        if (!paymentId || (type && !type.includes("payment"))) {
          return new Response("ignored", { status: 200 });
        }

        // Confirma o status direto na API (a notificação por si só não é confiável).
        const payment = await mp.getPayment(paymentId);
        if (!payment?.external_reference) return new Response("ignored", { status: 200 });

        await mp.applyPaymentToSale(
          payment.external_reference,
          mp.mapStatus(payment.status),
          String(payment.id),
        );

        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("ok", { status: 200 }),
    },
  },
});
