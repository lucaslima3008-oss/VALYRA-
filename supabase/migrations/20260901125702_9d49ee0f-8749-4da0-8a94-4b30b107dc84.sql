CREATE TABLE IF NOT EXISTS public.papeis_por_email (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'operacional',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.papeis_por_email TO authenticated;
GRANT ALL ON public.papeis_por_email TO service_role;

ALTER TABLE public.papeis_por_email ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin gerencia papeis por email" ON public.papeis_por_email;
CREATE POLICY "Admin gerencia papeis por email"
ON public.papeis_por_email FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = timezone('utc', now()); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS papeis_por_email_updated_at ON public.papeis_por_email;
CREATE TRIGGER papeis_por_email_updated_at
BEFORE UPDATE ON public.papeis_por_email
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sincronizar_meu_papel()
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
  alvo public.app_role;
  atual public.app_role;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;

  SELECT role INTO atual FROM public.user_roles WHERE user_id = uid LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    alvo := 'admin';
  ELSE
    SELECT role INTO alvo FROM public.papeis_por_email WHERE lower(email) = mail;
    IF alvo IS NULL THEN
      alvo := coalesce(atual, 'operacional');
    END IF;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = uid AND role <> alvo;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, alvo)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN alvo;
END $$;

REVOKE ALL ON FUNCTION public.sincronizar_meu_papel() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sincronizar_meu_papel() TO authenticated;