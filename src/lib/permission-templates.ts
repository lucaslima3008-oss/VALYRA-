import type { AppModule } from "@/components/layout/sidebar";
import { allModules, type ModulePermissions } from "@/lib/permissions";

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: ModulePermissions;
}

const admins: AppModule[] = [...allModules];

export const permissionTemplates: PermissionTemplate[] = [
  {
    id: "padrao",
    name: "Padrão Valyra",
    description:
      "Admin com acesso total; operacional em Produtos, Precificação, Estoque e Vendas.",
    permissions: {
      admin: admins,
      operacional: ["produtos", "precificacao", "estoque", "vendas"],
    },
  },
  {
    id: "operacional_ampliado",
    name: "Operacional ampliado",
    description:
      "Admin com acesso total; operacional também vê Fluxo de Caixa e Auditoria.",
    permissions: {
      admin: admins,
      operacional: [
        "produtos",
        "precificacao",
        "estoque",
        "vendas",
        "fluxo_caixa",
        "auditoria",
      ],
    },
  },
  {
    id: "somente_pdv",
    name: "Somente PDV",
    description: "Admin com acesso total; operacional restrito a Vendas / PDV.",
    permissions: {
      admin: admins,
      operacional: ["vendas"],
    },
  },
];
