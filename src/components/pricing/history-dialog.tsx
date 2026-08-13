import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDateTime, type AuditEntry } from "@/lib/audit";
import type { Product } from "@/lib/pricing";

export function HistoryDialog({
  product,
  entries,
}: {
  product: Product;
  entries: AuditEntry[];
}) {
  const rows = [...entries].sort((a, b) => (a.at < b.at ? 1 : -1));
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Histórico de alterações"
          title="Histórico de alterações"
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <History className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Histórico e auditoria</DialogTitle>
          <DialogDescription>
            Registro de alterações de preços e parâmetros de {product.name}.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-surface px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhuma alteração registrada para este produto.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-xl border bg-card">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-semibold">Data/Hora</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Usuário</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Alteração</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-b border-border/70 last:border-0 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(e.at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{e.user}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          e.kind === "preco"
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {e.kind === "preco" ? "Preço" : "Parâmetro"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium leading-tight">{e.field}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        <span className="line-through">{e.before}</span>
                        <span className="mx-1.5">→</span>
                        <span className="font-semibold text-foreground">{e.after}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
