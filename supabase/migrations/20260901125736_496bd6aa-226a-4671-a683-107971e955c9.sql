DROP TABLE IF EXISTS public.papeis_por_email;

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
  cadastro text;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;

  SELECT role INTO atual FROM public.user_roles WHERE user_id = uid LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    alvo := 'admin';
  ELSE
    SELECT lower(u.role) INTO cadastro
    FROM public.usuarios u
    WHERE lower(u.email) = mail
    ORDER BY u.created_at
    LIMIT 1;

    IF cadastro = 'admin' THEN
      alvo := 'admin';
    ELSIF cadastro IS NOT NULL THEN
      alvo := 'operacional';
    ELSE
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

DROP POLICY IF EXISTS "Acesso autenticado usuarios" ON public.usuarios;

CREATE POLICY "Usuarios visiveis para autenticados"
ON public.usuarios FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin gerencia usuarios"
ON public.usuarios FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));