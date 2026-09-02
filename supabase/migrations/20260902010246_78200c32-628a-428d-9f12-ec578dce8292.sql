CREATE TABLE public.permissoes_modulo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  modulo text NOT NULL,
  permitido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (role, modulo)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.permissoes_modulo TO authenticated;
GRANT ALL ON public.permissoes_modulo TO service_role;

ALTER TABLE public.permissoes_modulo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem permissoes" ON public.permissoes_modulo
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia permissoes" ON public.permissoes_modulo
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_permissoes_modulo_updated_at
  BEFORE UPDATE ON public.permissoes_modulo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.permissoes_modulo (role, modulo, permitido) VALUES
  ('admin','produtos',true),
  ('admin','precificacao',true),
  ('admin','estoque',true),
  ('admin','vendas',true),
  ('admin','fluxo_caixa',true),
  ('admin','usuarios',true),
  ('admin','auditoria',true),
  ('admin','configuracoes',true),
  ('operacional','produtos',true),
  ('operacional','precificacao',true),
  ('operacional','estoque',true),
  ('operacional','vendas',true),
  ('operacional','fluxo_caixa',false),
  ('operacional','usuarios',false),
  ('operacional','auditoria',false),
  ('operacional','configuracoes',false);