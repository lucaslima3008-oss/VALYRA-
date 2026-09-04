import type { AppModule } from "@/components/layout/sidebar";
import type { UserRole } from "@/lib/users";

/** Todos os módulos do sistema, na ordem exibida no menu. */
export const allModules: AppModule[] = [
  "produtos",
  "precificacao",
  "estoque",
  "vendas",
  "fluxo_caixa",
  "relatorios",
  "usuarios",
  "auditoria",
  "permissoes",
  "configuracoes",
];

export const moduleLabel: Record<AppModule, string> = {
  produtos: "Produtos",
  precificacao: "Precificação",
  estoque: "Estoque",
  vendas: "Vendas / PDV",
  fluxo_caixa: "Fluxo de Caixa",
  relatorios: "Relatórios",
  usuarios: "Usuários",
  auditoria: "Auditoria",
  permissoes: "Papéis & Permissões",
  configuracoes: "Configurações",
};

export type ModulePermissions = Record<UserRole, AppModule[]>;

/** Configuração padrão (usada como fallback enquanto o backend carrega). */
export const modulePermissions: ModulePermissions = {
  admin: [...allModules],
  operacional: ["produtos", "precificacao", "estoque", "vendas"],
};

/** Módulos que sempre pertencem ao administrador e não podem ser removidos. */
export const lockedAdminModules: AppModule[] = ["usuarios", "permissoes", "configuracoes"];

export const canAccessModule = (
  role: UserRole,
  module: AppModule,
  permissions: ModulePermissions = modulePermissions,
) => permissions[role]?.includes(module) ?? false;

export const defaultModuleFor = (
  role: UserRole,
  permissions: ModulePermissions = modulePermissions,
): AppModule => permissions[role]?.[0] ?? "produtos";
