import React from "react";
import {
  Calculator,
  Boxes,
  ShoppingCart,
  TrendingUp,
  Users,
  History,
  ShieldCheck,
  ChevronRight,
  Package,
  Settings,
} from "lucide-react";
import valyraMark from "@/assets/valyra-mark.png";
import { cn } from "@/lib/utils";
import { roleLabel, type UserRole } from "@/lib/users";

export type AppModule =
  | "produtos"
  | "precificacao"
  | "estoque"
  | "vendas"
  | "fluxo_caixa"
  | "usuarios"
  | "auditoria"
  | "permissoes"
  | "configuracoes";


interface SidebarProps {
  activeModule: AppModule;
  onSelectModule: (module: AppModule) => void;
  /** Nome exibido do usuário autenticado (normalmente o e-mail) */
  currentUserName: string;
  currentUserRole: UserRole;
  /** Módulos liberados para o papel do usuário autenticado */
  allowedModules: AppModule[];
  lowStockCount?: number;
  unresolvedAudits?: number;
  /** Controla a exibição do menu em overlay no mobile/tablet */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeModule,
  onSelectModule,
  currentUserName,
  currentUserRole,
  allowedModules,
  lowStockCount = 0,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const currentRole: UserRole = currentUserRole || "operacional";
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
            id: "permissoes" as AppModule,
            label: "Papéis & Permissões",
            icon: ShieldCheck,
            description: "Acessos por papel e módulo",
          },
          {
            id: "configuracoes" as AppModule,
            label: "Configurações",
            icon: Settings,
            description: "Integrações e pagamentos",
          },
        ]
      : []),
  ].filter((item) => allowedModules.includes(item.id));


  return (
    <>
      {/* Backdrop (mobile/tablet) */}
      <div
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-0 z-30 bg-black/70 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[17rem] max-w-[85vw] flex-col border-r border-[#D4AF37]/20 bg-[#0A0A0A] text-slate-100 select-none shadow-2xl transition-transform duration-200 lg:w-64 lg:max-w-none lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-[#D4AF37]/25 px-5">
        <img
          src={valyraMark}
          alt="Valyra"
          width={36}
          height={36}
          className="size-9 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.35)]"
        />
        <div className="flex flex-col">
          <span className="text-base font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
            Valyra
          </span>
          <span className="text-[11px] tracking-wide text-white/55">Inteligência em Precificação</span>
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
              onClick={() => {
                onSelectModule(item.id);
                onCloseMobile?.();
              }}
              className={cn(
                "group relative flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#D4AF37]/12 text-white shadow-lg shadow-black/60 ring-1 ring-[#D4AF37]/40"
                  : "text-slate-300 hover:bg-white/5 hover:text-[#D4AF37]",
              )}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#D4AF37]" />
              )}

              <Icon
                className={cn(
                  "size-4.5 shrink-0 transition-colors",
                  isActive ? "text-[#D4AF37]" : "text-slate-400 group-hover:text-slate-200",
                )}
              />

              <div className="flex flex-1 flex-col truncate">
                <div className="flex items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-2 rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "truncate text-[11px]",
                    isActive ? "text-[#D4AF37]/70" : "text-slate-400",
                  )}
                >
                  {item.description}
                </span>
              </div>

              <ChevronRight
                className={cn(
                  "size-4 shrink-0 transition-transform opacity-0 group-hover:opacity-100",
                  isActive && "opacity-100 text-[#D4AF37]",
                )}
              />
            </button>
          );
        })}
      </div>

      {/* User Switcher / Profile Footer */}
      <div className="border-t border-[#D4AF37]/20 bg-black/60 p-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
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

          <p className="truncate text-xs font-medium text-slate-200" title={currentUserName}>
            {currentUserName}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {isAdmin
              ? "Acesso total aos módulos do sistema"
              : "Acesso limitado aos módulos operacionais"}
          </p>
        </div>
      </div>
      </aside>
    </>
  );
}
