import React from "react";
import {
  Calculator,
  Boxes,
  ShoppingCart,
  TrendingUp,
  Users,
  History,
  ShieldCheck,
  Building2,
  ChevronRight,
  Package,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabel, type AppUser } from "@/lib/users";

export type AppModule =
  | "produtos"
  | "precificacao"
  | "estoque"
  | "vendas"
  | "fluxo_caixa"
  | "usuarios"
  | "auditoria"
  | "configuracoes";

interface SidebarProps {
  activeModule: AppModule;
  onSelectModule: (module: AppModule) => void;
  users: AppUser[];
  currentUserId: string;
  onSelectUser: (userId: string) => void;
  lowStockCount?: number;
  unresolvedAudits?: number;
}

const fallbackUser: AppUser = {
  id: "usr-default",
  name: "Administrador",
  email: "admin@empresa.com.br",
  role: "admin",
  status: "ativo",
};

export function Sidebar({
  activeModule,
  onSelectModule,
  users = [],
  currentUserId,
  onSelectUser,
  lowStockCount = 0,
}: SidebarProps) {
  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || fallbackUser;
  const currentRole = currentUser.role || "admin";
  const isAdmin = currentRole === "admin";

  const navigationItems = [
    {
      id: "produtos" as AppModule,
      label: "Produtos",
      icon: Package,
      description: "Cadastro e fichas técnicas",
    },
    {
      id: "precificacao" as AppModule,
      label: "Precificação",
      icon: Calculator,
      description: "Tabela, custos e margens",
    },
    {
      id: "estoque" as AppModule,
      label: "Estoque",
      icon: Boxes,
      description: "Quantidades e movimentações",
      badge: lowStockCount > 0 ? `${lowStockCount} alertas` : undefined,
      badgeTone: "warning" as const,
    },
    {
      id: "vendas" as AppModule,
      label: "Vendas / PDV",
      icon: ShoppingCart,
      description: "Checkout e pagamentos",
    },
    {
      id: "fluxo_caixa" as AppModule,
      label: "Fluxo de Caixa",
      icon: TrendingUp,
      description: "Entradas, saídas e saldo",
    },
    {
      id: "usuarios" as AppModule,
      label: "Usuários",
      icon: Users,
      description: "Gestão de perfis e acessos",
    },
    {
      id: "auditoria" as AppModule,
      label: "Auditoria",
      icon: History,
      description: "Histórico de alterações",
    },
    ...(isAdmin
      ? [
          {
            id: "configuracoes" as AppModule,
            label: "Configurações",
            icon: Settings,
            description: "Integrações e pagamentos",
          },
        ]
      : []),
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 select-none shadow-2xl">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-md shadow-cyan-500/20">
          <Building2 className="size-5 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold tracking-tight text-white text-base">Cost &amp; Price</span>
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300">
              PRO
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Gestão &amp; Rentabilidade</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Módulos do Sistema
        </p>

        {navigationItems.map((item) => {
          const isActive = activeModule === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white shadow-lg shadow-indigo-950/50"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              )}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-400" />
              )}

              <Icon
                className={cn(
                  "size-4.5 shrink-0 transition-colors",
                  isActive ? "text-cyan-300" : "text-slate-400 group-hover:text-slate-200",
                )}
              />

              <div className="flex flex-1 flex-col truncate">
                <div className="flex items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "truncate text-[11px]",
                    isActive ? "text-indigo-200" : "text-slate-400",
                  )}
                >
                  {item.description}
                </span>
              </div>

              <ChevronRight
                className={cn(
                  "size-4 shrink-0 transition-transform opacity-0 group-hover:opacity-100",
                  isActive && "opacity-100 text-indigo-300",
                )}
              />
            </button>
          );
        })}
      </div>

      {/* User Switcher / Profile Footer */}
      <div className="border-t border-slate-800/80 bg-slate-950/60 p-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck
                className={cn(
                  "size-4",
                  isAdmin ? "text-emerald-400" : "text-amber-400",
                )}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Sessão Ativa
              </span>
            </div>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                isAdmin
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30",
              )}
            >
              {roleLabel[currentRole] || "Admin"}
            </span>
          </div>

          <div className="relative">
            <select
              aria-label="Alternar perfil de usuário"
              value={currentUser.id}
              onChange={(e) => onSelectUser(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-1.5 pr-8 text-xs font-medium text-slate-200 outline-none transition-colors hover:border-slate-600 focus:border-indigo-500"
            >
              {users.length > 0 ? (
                users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-slate-100">
                    {u.name} ({roleLabel[u.role] || u.role})
                  </option>
                ))
              ) : (
                <option value={fallbackUser.id} className="bg-slate-900 text-slate-100">
                  {fallbackUser.name} ({roleLabel[fallbackUser.role]})
                </option>
              )}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
