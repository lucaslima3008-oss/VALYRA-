CREATE POLICY "Autenticados leem logo da empresa"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'empresa');

CREATE POLICY "Admin envia logo da empresa"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'empresa' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin atualiza logo da empresa"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'empresa' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'empresa' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin remove logo da empresa"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'empresa' AND public.has_role(auth.uid(), 'admin'));