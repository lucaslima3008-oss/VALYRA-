-- Remove acesso público (anon) e restringe tudo a usuários autenticados

DROP POLICY IF EXISTS "Permissao publica produtos" ON public.produtos;
DROP POLICY IF EXISTS "Permissao publica ficha" ON public.ficha_tecnica_itens;
DROP POLICY IF EXISTS "Permissao publica estoque" ON public.estoque;
DROP POLICY IF EXISTS "Permissao publica movimentacoes" ON public.movimentacoes_estoque;
DROP POLICY IF EXISTS "Permissao publica vendas" ON public.vendas;
DROP POLICY IF EXISTS "Permissao publica itens_venda" ON public.itens_venda;
DROP POLICY IF EXISTS "Permissao publica fluxo_caixa" ON public.fluxo_caixa;
DROP POLICY IF EXISTS "Permissao publica usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permissao publica auditoria" ON public.historico_auditoria;
DROP POLICY IF EXISTS "Permissao publica maquininhas" ON public.maquininhas;

REVOKE ALL ON public.produtos FROM anon;
REVOKE ALL ON public.ficha_tecnica_itens FROM anon;
REVOKE ALL ON public.estoque FROM anon;
REVOKE ALL ON public.movimentacoes_estoque FROM anon;
REVOKE ALL ON public.vendas FROM anon;
REVOKE ALL ON public.itens_venda FROM anon;
REVOKE ALL ON public.fluxo_caixa FROM anon;
REVOKE ALL ON public.usuarios FROM anon;
REVOKE ALL ON public.historico_auditoria FROM anon;
REVOKE ALL ON public.maquininhas FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ficha_tecnica_itens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_estoque TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_venda TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fluxo_caixa TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_auditoria TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maquininhas TO authenticated;

GRANT ALL ON public.produtos TO service_role;
GRANT ALL ON public.ficha_tecnica_itens TO service_role;
GRANT ALL ON public.estoque TO service_role;
GRANT ALL ON public.movimentacoes_estoque TO service_role;
GRANT ALL ON public.vendas TO service_role;
GRANT ALL ON public.itens_venda TO service_role;
GRANT ALL ON public.fluxo_caixa TO service_role;
GRANT ALL ON public.usuarios TO service_role;
GRANT ALL ON public.historico_auditoria TO service_role;
GRANT ALL ON public.maquininhas TO service_role;

CREATE POLICY "Acesso autenticado produtos" ON public.produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso autenticado ficha" ON public.ficha_tecnica_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso autenticado estoque" ON public.estoque FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso autenticado movimentacoes" ON public.movimentacoes_estoque FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso autenticado vendas" ON public.vendas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso autenticado itens_venda" ON public.itens_venda FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso autenticado fluxo_caixa" ON public.fluxo_caixa FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso autenticado usuarios" ON public.usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso autenticado auditoria" ON public.historico_auditoria FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso autenticado maquininhas" ON public.maquininhas FOR ALL TO authenticated USING (true) WITH CHECK (true);