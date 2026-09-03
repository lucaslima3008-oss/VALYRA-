import { supabase } from "@/integrations/supabase/client";

/** Dados da empresa do cliente, usados na identidade dos relatórios exportados. */
export interface CompanyProfile {
  id?: string;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  /** Caminho do arquivo dentro do bucket "empresa" (ex: "logo-123.png"). */
  logoPath: string;
}

export const emptyCompany: CompanyProfile = {
  name: "",
  cnpj: "",
  address: "",
  phone: "",
  email: "",
  logoPath: "",
};

const LOGO_BUCKET = "empresa";

/** Lê o registro único de dados da empresa. Retorna null se ainda não houver cadastro. */
export async function fetchCompanyProfile(): Promise<CompanyProfile | null> {
  const { data, error } = await supabase
    .from("dados_empresa")
    .select("id, nome, cnpj, endereco, telefone, email, logo_url")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("Erro ao carregar dados da empresa:", error);
    return null;
  }
  const row = data?.[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.nome ?? "",
    cnpj: row.cnpj ?? "",
    address: row.endereco ?? "",
    phone: row.telefone ?? "",
    email: row.email ?? "",
    logoPath: row.logo_url ?? "",
  };
}

/** Cria ou atualiza o registro único de dados da empresa (somente admin, via RLS). */
export async function saveCompanyProfile(profile: CompanyProfile): Promise<CompanyProfile> {
  const payload = {
    nome: profile.name,
    cnpj: profile.cnpj || null,
    endereco: profile.address || null,
    telefone: profile.phone || null,
    email: profile.email || null,
    logo_url: profile.logoPath || null,
  };

  if (profile.id) {
    const { error } = await supabase.from("dados_empresa").update(payload).eq("id", profile.id);
    if (error) throw error;
    return profile;
  }

  const { data, error } = await supabase
    .from("dados_empresa")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return { ...profile, id: data.id };
}

/** Envia a logo para o Storage e devolve o caminho salvo. */
export async function uploadCompanyLogo(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Baixa a logo e converte para data URL (usada no preview e dentro do PDF). */
export async function loadCompanyLogoDataUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(LOGO_BUCKET).download(path);
  if (error || !data) {
    console.error("Erro ao carregar a logo da empresa:", error);
    return null;
  }
  return await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(data);
  });
}
