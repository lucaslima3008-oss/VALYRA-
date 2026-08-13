import { createClient } from "@supabase/supabase-js";

// Configurações de ambiente do Supabase
// No Lovable / Vite, essas variáveis são fornecidas via .env ou integração do painel
const envUrl = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || "";
const envAnonKey = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) || "";

const supabaseUrl = envUrl || "https://placeholder-project.supabase.co";
const supabaseAnonKey = envAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

export const isSupabaseConfigured =
  Boolean(envUrl) &&
  Boolean(envAnonKey) &&
  !envUrl.includes("placeholder-project");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
