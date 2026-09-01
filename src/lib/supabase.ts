// Usa o cliente oficial do backend (com sessão autenticada persistida),
// para que todas as consultas respeitem as políticas de acesso por usuário logado.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as authenticatedClient } from "@/integrations/supabase/client";

// Exportado sem os tipos gerados: esta camada de serviço faz o próprio mapeamento de linhas.
export const supabase = authenticatedClient as unknown as SupabaseClient;

export const isSupabaseConfigured =
  Boolean(import.meta.env["VITE_SUPABASE_URL"]) &&
  Boolean(import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]);
