import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppModule } from "@/components/layout/sidebar";
import type { UserRole } from "@/lib/users";
import {
  allModules,
  lockedAdminModules,
  modulePermissions as defaultPermissions,
  type ModulePermissions,
} from "@/lib/permissions";

interface Row {
  role: UserRole;
  modulo: string;
  permitido: boolean;
}

const toMap = (rows: Row[]): ModulePermissions => {
  const map: ModulePermissions = { admin: [], operacional: [] };
  for (const row of rows) {
    if (!row.permitido) continue;
    const mod = row.modulo as AppModule;
    if (!allModules.includes(mod)) continue;
    if (!map[row.role]) continue;
    map[row.role].push(mod);
  }
  for (const mod of lockedAdminModules) {
    if (!map.admin.includes(mod)) map.admin.push(mod);
  }
  // Mantém a ordem oficial dos módulos
  (Object.keys(map) as UserRole[]).forEach((r) => {
    map[r] = allModules.filter((m) => map[r].includes(m));
  });
  return map;
};

/** Lê e grava a matriz de permissões (papel x módulo) no backend. */
export function useModulePermissions() {
  const [permissions, setPermissions] = useState<ModulePermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("permissoes_modulo")
        .select("role, modulo, permitido");
      if (error) throw error;
      if (data && data.length > 0) setPermissions(toMap(data as unknown as Row[]));
    } catch (err) {
      console.error("Erro ao carregar permissões de módulos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setPermission = useCallback(
    async (role: UserRole, modulo: AppModule, permitido: boolean) => {
      setPermissions((prev) => {
        const current = new Set(prev[role]);
        if (permitido) current.add(modulo);
        else current.delete(modulo);
        return { ...prev, [role]: allModules.filter((m) => current.has(m)) };
      });

      const { error } = await supabase
        .from("permissoes_modulo")
        .upsert({ role, modulo, permitido }, { onConflict: "role,modulo" });

      if (error) {
        console.error("Erro ao salvar permissão:", error);
        await load();
        return false;
      }
      return true;
    },
    [load],
  );

  /** Aplica de uma vez uma matriz completa de permissões (template). */
  const applyTemplate = useCallback(
    async (template: ModulePermissions) => {
      const normalized: ModulePermissions = {
        admin: allModules.filter(
          (m) => template.admin.includes(m) || lockedAdminModules.includes(m),
        ),
        operacional: allModules.filter((m) => template.operacional.includes(m)),
      };
      setPermissions(normalized);

      const rows = (Object.keys(normalized) as UserRole[]).flatMap((role) =>
        allModules.map((modulo) => ({
          role,
          modulo,
          permitido: normalized[role].includes(modulo),
        })),
      );

      const { error } = await supabase
        .from("permissoes_modulo")
        .upsert(rows, { onConflict: "role,modulo" });

      if (error) {
        console.error("Erro ao aplicar template de permissões:", error);
        await load();
        return false;
      }
      return true;
    },
    [load],
  );

  return { permissions, loading, setPermission, applyTemplate, refresh: load };
}

