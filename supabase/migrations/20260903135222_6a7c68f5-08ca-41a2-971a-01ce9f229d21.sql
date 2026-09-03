CREATE TABLE public.dados_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  cnpj text,
  endereco text,
  telefone text,
  email text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dados_empresa TO authenticated;
GRANT ALL ON public.dados_empresa TO service_role;

ALTER TABLE public.dados_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem dados da empresa"
  ON public.dados_empresa FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia dados da empresa"
  ON public.dados_empresa FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_dados_empresa_updated_at
  BEFORE UPDATE ON public.dados_empresa
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();