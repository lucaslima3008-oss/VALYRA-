import { createClient } from "@supabase/supabase-js";

const envUrl = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || "";
const envAnonKey = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) || "";

const supabaseUrl = envUrl || "https://placeholder-project.supabase.co";
// Token JWT válido e seguro para inicialização em SSR/Client quando ainda não configurado
const supabaseAnonKey =
  envAnonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder";

export const isSupabaseConfigured =
  Boolean(envUrl) &&
  Boolean(envAnonKey) &&
  !envUrl.includes("placeholder-project");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  },
});
