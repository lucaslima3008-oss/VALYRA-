DROP POLICY IF EXISTS "Admin gerencia dados da empresa" ON public.dados_empresa;
CREATE POLICY "Admin gerencia dados da empresa"
  ON public.dados_empresa FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

DROP POLICY IF EXISTS "Admin envia logo da empresa" ON storage.objects;
CREATE POLICY "Admin envia logo da empresa"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'empresa' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

DROP POLICY IF EXISTS "Admin atualiza logo da empresa" ON storage.objects;
CREATE POLICY "Admin atualiza logo da empresa"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'empresa' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (bucket_id = 'empresa' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

DROP POLICY IF EXISTS "Admin remove logo da empresa" ON storage.objects;
CREATE POLICY "Admin remove logo da empresa"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'empresa' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));