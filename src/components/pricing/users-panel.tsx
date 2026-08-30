import { useState } from "react";
import { Plus, ShieldCheck, User as UserIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { emptyUser, roleLabel, type AppUser, type UserRole, type UserStatus } from "@/lib/users";

interface Props {
  users: AppUser[];
  canManage: boolean;
  onCreate: (u: AppUser) => void;
  onUpdate: (id: string, patch: Partial<AppUser>) => void;
  onDelete: (id: string) => void;
}

export function UsersPanel({ users, canManage, onCreate, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AppUser>(emptyUser);
  const set = (patch: Partial<AppUser>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = () => {
    if (!draft.name.trim() || !draft.email.trim()) return;
    onCreate({ ...draft });
    setDraft(emptyUser());
    setOpen(false);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Gestão de Usuários</h2>
          <p className="text-sm text-muted-foreground">
            Perfis de acesso: administradores editam preços e parâmetros; operacionais têm
            visualização.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!canManage}>
          <Plus className="size-4" /> Novo Usuário
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-surface text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold">E-mail</th>
              <th className="px-4 py-3 text-left font-semibold">Perfil</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-border/70 transition-colors duration-200 last:border-0 hover:bg-muted/40"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg",
                        u.role === "admin"
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      {u.role === "admin" ? (
                        <ShieldCheck className="size-4" />
                      ) : (
                        <UserIcon className="size-4" />
                      )}
                    </span>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Perfil de ${u.name}`}
                    disabled={!canManage}
                    value={u.role}
                    onChange={(e) => onUpdate(u.id, { role: e.target.value as UserRole })}
                    className="rounded-md border bg-card px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"
                  >
                    <option value="admin">Admin</option>
                    <option value="operacional">Operacional</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={() =>
                      onUpdate(u.id, { status: u.status === "ativo" ? "inativo" : "ativo" })
                    }
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200 disabled:opacity-60",
                      u.status === "ativo"
                        ? "bg-success-soft text-success"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {u.status === "ativo" ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-3 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!canManage}
                    aria-label={`Remover ${u.name}`}
                    className="size-11 text-muted-foreground hover:text-destructive sm:size-9"
                    onClick={() => onDelete(u.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Cadastre o acesso e defina o nível de permissão do colaborador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nome completo</Label>
              <Input
                placeholder="Ex.: Ana Ribeiro"
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">E-mail corporativo</Label>
              <Input
                type="email"
                placeholder="ana.ribeiro@empresa.com"
                value={draft.email}
                onChange={(e) => set({ email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Perfil</Label>
                <div className="inline-flex w-full rounded-lg border bg-surface p-1">
                  {(["admin", "operacional"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set({ role: r })}
                      className={cn(
                        "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors duration-200",
                        draft.role === r
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {roleLabel[r]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                <div className="inline-flex w-full rounded-lg border bg-surface p-1">
                  {(["ativo", "inativo"] as UserStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set({ status: s })}
                      className={cn(
                        "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold capitalize transition-colors duration-200",
                        draft.status === s
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={!draft.name.trim() || !draft.email.trim()}>
              Salvar usuário
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
