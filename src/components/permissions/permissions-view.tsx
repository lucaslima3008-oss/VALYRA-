import { Lock, ShieldCheck, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppModule } from "@/components/layout/sidebar";
import { roleLabel, type AppUser, type UserRole } from "@/lib/users";
import {
  allModules,
  lockedAdminModules,
  moduleLabel,
  type ModulePermissions,
} from "@/lib/permissions";

interface Props {
  permissions: ModulePermissions;
  loading?: boolean;
  onTogglePermission: (role: UserRole, module: AppModule, allowed: boolean) => void;
  users: AppUser[];
  onChangeUserRole: (id: string, role: UserRole) => void;
}

const roles: UserRole[] = ["admin", "operacional"];

export function PermissionsView({
  permissions,
  loading = false,
  onTogglePermission,
  users,
  onChangeUserRole,
}: Props) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Papéis & Permissões</h2>
        <p className="text-sm text-muted-foreground">
          Defina quais módulos cada papel enxerga e atribua o papel de cada colaborador.
        </p>
      </div>

      {/* Matriz de permissões */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-surface text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 text-left font-semibold">Módulo</th>
              {roles.map((r) => (
                <th key={r} className="px-4 py-3 text-center font-semibold">
                  {roleLabel[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allModules.map((mod) => (
              <tr key={mod} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                <td className="px-5 py-3 font-medium">{moduleLabel[mod]}</td>
                {roles.map((r) => {
                  const locked = r === "admin" && lockedAdminModules.includes(mod);
                  const active = permissions[r]?.includes(mod) ?? false;
                  return (
                    <td key={r} className="px-4 py-2 text-center">
                      <button
                        type="button"
                        disabled={locked || loading}
                        aria-pressed={active}
                        aria-label={`${moduleLabel[mod]} para ${roleLabel[r]}`}
                        onClick={() => onTogglePermission(r, mod, !active)}
                        className={cn(
                          "inline-flex min-h-11 min-w-[104px] items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-colors duration-200 disabled:opacity-60",
                          active
                            ? "bg-success-soft text-success"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {locked && <Lock className="size-3" />}
                        {active ? "Liberado" : "Bloqueado"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Atribuição de papéis */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Papel por colaborador</h3>
          <p className="text-sm text-muted-foreground">
            O papel é aplicado no próximo acesso do colaborador ao sistema.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-surface text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 text-left font-semibold">Colaborador</th>
                <th className="px-4 py-3 text-left font-semibold">E-mail</th>
                <th className="px-4 py-3 text-left font-semibold">Papel</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-muted-foreground">
                    Nenhum colaborador cadastrado.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
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
                      aria-label={`Papel de ${u.name}`}
                      value={u.role}
                      onChange={(e) => onChangeUserRole(u.id, e.target.value as UserRole)}
                      className="min-h-11 rounded-md border bg-card px-2.5 text-xs font-medium"
                    >
                      <option value="admin">Admin</option>
                      <option value="operacional">Operacional</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
