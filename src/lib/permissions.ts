import type { AppModule } from "@/components/layout/sidebar";
import type { UserRole } from "@/lib/users";

/** Módulos que cada papel pode acessar. */
export const modulePermissions: Record<UserRole, AppModule[]> = {
  admin: [
    "produtos",
    "precificacao",
    "estoque",
    "vendas",
    "fluxo_caixa",
    "usuarios",
    "auditoria",
    "configuracoes",
  ],
  operacional: ["produtos", "precificacao", "estoque", "vendas"],
};

export const canAccessModule = (role: UserRole, module: AppModule) =>
  modulePermissions[role]?.includes(module) ?? false;

export const defaultModuleFor = (role: UserRole): AppModule =>
  modulePermissions[role]?.[0] ?? "produtos";
