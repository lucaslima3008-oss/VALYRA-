import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "@/lib/users";

interface AppRoleState {
  role: UserRole | null;
  userId: string | null;
  email: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Lê o papel do usuário autenticado a partir da tabela de papéis do backend.
 * Sincroniza automaticamente com o cadastro de usuários (por e-mail) no login.
 */
export function useAppRole(): AppRoleState {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setRole(null);
        setUserId(null);
        setEmail(null);
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? null);

      // Garante que o papel existe e está alinhado ao cadastro de usuários.
      const { data: synced } = await supabase.rpc("sincronizar_meu_papel");
      if (synced === "admin" || synced === "operacional") {
        setRole(synced);
        return;
      }

      const { data: rows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1);

      const found = rows?.[0]?.role;
      setRole(found === "admin" ? "admin" : found ? "operacional" : "operacional");
    } catch (err) {
      console.error("Erro ao carregar permissões:", err);
      setRole("operacional");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return { role, userId, email, loading, refresh: load };
}
