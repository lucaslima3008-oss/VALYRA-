import { useEffect, useRef, useState } from "react";
import { Building2, Image as ImageIcon, Loader2, Save, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emptyCompany,
  fetchCompanyProfile,
  loadCompanyLogoDataUrl,
  saveCompanyProfile,
  uploadCompanyLogo,
  type CompanyProfile,
} from "@/lib/company";

export function CompanySection({ isAdmin }: { isAdmin: boolean }) {
  const [company, setCompany] = useState<CompanyProfile>(emptyCompany);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const profile = await fetchCompanyProfile();
      if (profile) {
        setCompany(profile);
        setLogoPreview(await loadCompanyLogoDataUrl(profile.logoPath));
      }
      setLoading(false);
    })();
  }, []);

  const set = (patch: Partial<CompanyProfile>) => {
    setCompany((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const path = await uploadCompanyLogo(file);
      set({ logoPath: path });
      setLogoPreview(await loadCompanyLogoDataUrl(path));
    } catch (err) {
      console.error(err);
      setError("Não foi possível enviar a logo. Verifique o formato (PNG/JPG) e o tamanho (até 5MB).");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const updated = await saveCompanyProfile(company);
      setCompany(updated);
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar os dados da empresa.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="size-4 animate-spin" /> Carregando dados da empresa...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex items-center gap-2">
        <Building2 className="size-4 text-[#D4AF37]" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Dados da Empresa
        </h3>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Estas informações aparecem no cabeçalho e no rodapé dos relatórios exportados em PDF. A
        marca Valyra continua sendo apenas a identidade do sistema.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="text-xs text-slate-500">Nome / Razão social *</Label>
          <Input
            value={company.name}
            disabled={!isAdmin}
            placeholder="Ex: Doces da Ana LTDA"
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">CNPJ</Label>
          <Input
            value={company.cnpj}
            disabled={!isAdmin}
            placeholder="Opcional"
            onChange={(e) => set({ cnpj: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Telefone</Label>
          <Input
            value={company.phone}
            disabled={!isAdmin}
            placeholder="Opcional"
            onChange={(e) => set({ phone: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">E-mail</Label>
          <Input
            value={company.email}
            disabled={!isAdmin}
            placeholder="Opcional"
            onChange={(e) => set({ email: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Endereço</Label>
          <Input
            value={company.address}
            disabled={!isAdmin}
            placeholder="Opcional"
            onChange={(e) => set({ address: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <Label className="text-xs text-slate-500">Logo da empresa (PNG ou JPG)</Label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo da empresa" className="size-full object-contain" />
              ) : (
                <ImageIcon className="size-5 text-slate-400" />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => void handleLogo(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!isAdmin || uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {logoPreview ? "Trocar logo" : "Enviar logo"}
            </Button>
            {logoPreview && isAdmin && (
              <Button
                type="button"
                variant="ghost"
                className="text-xs text-slate-500"
                onClick={() => {
                  set({ logoPath: "" });
                  setLogoPreview(null);
                }}
              >
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Preview do documento */}
      <div className="mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Preview do PDF
        </p>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-inner dark:border-slate-700">
          <div className="flex items-center gap-3 border-b-2 border-[#D4AF37] pb-3">
            {logoPreview && (
              <img src={logoPreview} alt="" className="size-12 shrink-0 object-contain" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {company.name || "Nome da sua empresa"}
              </p>
              <p className="text-xs font-semibold text-slate-700">Relatório de Vendas</p>
              <p className="text-[10px] text-slate-500">
                Período: 01/01 a 31/01 · Emitido em {new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <div className="my-4 space-y-1.5">
            <div className="h-2.5 w-full rounded bg-slate-900/80" />
            <div className="h-2 w-full rounded bg-slate-100" />
            <div className="h-2 w-full rounded bg-slate-50" />
            <div className="h-2 w-full rounded bg-slate-100" />
          </div>
          <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-500">
            {[company.cnpj && `CNPJ: ${company.cnpj}`, company.address, company.phone, company.email]
              .filter(Boolean)
              .join("  ·  ") || "CNPJ, endereço e contatos aparecem aqui quando preenchidos."}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}

      {isAdmin && (
        <div className="mt-4 flex items-center gap-3">
          <Button className="gap-2" disabled={saving || !company.name.trim()} onClick={() => void submit()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Check className="size-3.5" /> Dados salvos
            </span>
          )}
        </div>
      )}
    </div>
  );
}
