-- usuarios: only own record or admin
DROP POLICY IF EXISTS "Usuarios visiveis para autenticados" ON public.usuarios;
CREATE POLICY "Usuario ve o proprio cadastro ou admin" ON public.usuarios
  FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email','')) OR public.has_role(auth.uid(),'admin'));

-- dados_empresa: admin only read
DROP POLICY IF EXISTS "Autenticados leem dados da empresa" ON public.dados_empresa;

-- permissoes_modulo: read only own role rows (or admin)
DROP POLICY IF EXISTS "Autenticados leem permissoes" ON public.permissoes_modulo;
CREATE POLICY "Le permissoes do proprio papel" ON public.permissoes_modulo
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), role) OR public.has_role(auth.uid(),'admin'));

-- configuracoes_pagamento: explicit admin-only policies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_pagamento TO authenticated;
CREATE POLICY "Admin gerencia configuracoes pagamento" ON public.configuracoes_pagamento
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- produtos / ficha / estoque: leitura e operacao para autenticados, exclusao só admin
DROP POLICY IF EXISTS "Acesso autenticado produtos" ON public.produtos;
CREATE POLICY "Le produtos" ON public.produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cria produtos" ON public.produtos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Atualiza produtos" ON public.produtos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin apaga produtos" ON public.produtos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Acesso autenticado ficha" ON public.ficha_tecnica_itens;
CREATE POLICY "Le ficha" ON public.ficha_tecnica_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cria ficha" ON public.ficha_tecnica_itens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Atualiza ficha" ON public.ficha_tecnica_itens FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Apaga ficha" ON public.ficha_tecnica_itens FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Acesso autenticado estoque" ON public.estoque;
CREATE POLICY "Le estoque" ON public.estoque FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cria estoque" ON public.estoque FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Atualiza estoque" ON public.estoque FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin apaga estoque" ON public.estoque FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- movimentacoes: apenas registro e leitura, sem edicao/exclusao
DROP POLICY IF EXISTS "Acesso autenticado movimentacoes" ON public.movimentacoes_estoque;
CREATE POLICY "Le movimentacoes" ON public.movimentacoes_estoque FOR SELECT TO authenticated USING (true);
CREATE POLICY "Registra movimentacoes" ON public.movimentacoes_estoque FOR INSERT TO authenticated WITH CHECK (true);

-- auditoria: leitura admin, insercao autenticada, imutavel
DROP POLICY IF EXISTS "Acesso autenticado auditoria" ON public.historico_auditoria;
CREATE POLICY "Admin le auditoria" ON public.historico_auditoria FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Registra auditoria" ON public.historico_auditoria FOR INSERT TO authenticated WITH CHECK (true);

-- vendas / itens: registro por autenticados, alteracao e exclusao só admin
DROP POLICY IF EXISTS "Acesso autenticado vendas" ON public.vendas;
CREATE POLICY "Le vendas" ON public.vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cria vendas" ON public.vendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin atualiza vendas" ON public.vendas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin apaga vendas" ON public.vendas FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Acesso autenticado itens_venda" ON public.itens_venda;
CREATE POLICY "Le itens_venda" ON public.itens_venda FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cria itens_venda" ON public.itens_venda FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin apaga itens_venda" ON public.itens_venda FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- fluxo de caixa: leitura admin, lancamento autenticado
DROP POLICY IF EXISTS "Acesso autenticado fluxo_caixa" ON public.fluxo_caixa;
CREATE POLICY "Admin le fluxo_caixa" ON public.fluxo_caixa FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Lanca fluxo_caixa" ON public.fluxo_caixa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin gerencia fluxo_caixa" ON public.fluxo_caixa FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin apaga fluxo_caixa" ON public.fluxo_caixa FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- maquininhas: leitura autenticada, gestao admin
DROP POLICY IF EXISTS "Acesso autenticado maquininhas" ON public.maquininhas;
CREATE POLICY "Le maquininhas" ON public.maquininhas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia maquininhas" ON public.maquininhas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- funcao definer nao utilizada pelo app
REVOKE EXECUTE ON FUNCTION public.claim_initial_admin() FROM authenticated, anon, public;