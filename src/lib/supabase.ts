// Usa o cliente oficial do backend (com sessão autenticada persistida),
// para que todas as consultas respeitem as políticas de acesso por usuário logado.
export { supabase } from "@/integrations/supabase/client";

export const isSupabaseConfigured =
  Boolean(import.meta.env["VITE_SUPABASE_URL"]) &&
  Boolean(import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]);
