-- ==============================================================================
-- SCHEMA COMPLETO SUPABASE: COST & PRICE (PORTFÓLIO, ESTOQUE, PDV, FLUXO, USUÁRIOS, AUDITORIA)
-- ==============================================================================

-- 1. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('fabricado', 'revenda')),
    labor_minutes NUMERIC DEFAULT 0,
    labor_cost_per_minute NUMERIC DEFAULT 0,
    supplier_price NUMERIC DEFAULT 0,
    freight NUMERIC DEFAULT 0,
    purchase_tax NUMERIC DEFAULT 0,
    margin_pct NUMERIC DEFAULT 25.0,
    card_fee_pct NUMERIC DEFAULT 3.5,
    logistics_cost NUMERIC DEFAULT 0,
    manual_price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE ITENS DA FICHA TÉCNICA (BOM, EMBALAGENS E TAXAS CUSTOMIZADAS)
CREATE TABLE IF NOT EXISTS public.ficha_tecnica_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('bom', 'packaging', 'custom_fee')),
    nome TEXT NOT NULL,
    quantidade NUMERIC DEFAULT 1,
    unit_cost NUMERIC DEFAULT 0,
    fee_kind TEXT CHECK (fee_kind IN ('percent', 'fixed')),
    fee_value NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE ESTOQUE
CREATE TABLE IF NOT EXISTS public.estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('produto_final', 'insumo')),
    saldo_atual NUMERIC NOT NULL DEFAULT 0,
    saldo_minimo NUMERIC NOT NULL DEFAULT 0,
    unidade TEXT NOT NULL DEFAULT 'un',
    custo_unitario NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.estoque(id) ON DELETE CASCADE NOT NULL,
    item_nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'venda')),
    quantidade NUMERIC NOT NULL,
    saldo_apos NUMERIC NOT NULL,
    motivo TEXT,
    usuario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE VENDAS (PDV)
CREATE TABLE IF NOT EXISTS public.vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    subtotal NUMERIC NOT NULL,
    desconto NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL,
    forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro')),
    taxa_cartao_pct NUMERIC NOT NULL DEFAULT 0,
    valor_taxa_cartao NUMERIC NOT NULL DEFAULT 0,
    receita_liquida NUMERIC NOT NULL,
    custo_total NUMERIC NOT NULL DEFAULT 0,
    lucro_bruto NUMERIC NOT NULL DEFAULT 0,
    margem_realizada_pct NUMERIC NOT NULL DEFAULT 0,
    usuario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE ITENS DA VENDA
CREATE TABLE IF NOT EXISTS public.itens_venda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE NOT NULL,
    produto_id UUID,
    nome TEXT NOT NULL,
    quantidade NUMERIC NOT NULL,
    preco_unitario NUMERIC NOT NULL,
    custo_unitario NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL
);

-- 7. TABELA DE FLUXO DE CAIXA
CREATE TABLE IF NOT EXISTS public.fluxo_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    categoria TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    usuario TEXT NOT NULL,
    venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operacional')),
    status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABELA DE HISTÓRICO DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.historico_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID,
    usuario TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('preco', 'parametro')),
    campo TEXT NOT NULL,
    antes TEXT,
    depois TEXT,
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- POLÍTICAS DE RLS (ROW LEVEL SECURITY)
-- ==============================================================================
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ficha_tecnica_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxo_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_auditoria ENABLE ROW LEVEL SECURITY;

-- Permitir acesso universal para usuários autenticados e chave anônima da aplicação
CREATE POLICY "Permissao publica produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissao publica ficha" ON public.ficha_tecnica_itens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissao publica estoque" ON public.estoque FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissao publica movimentacoes" ON public.movimentacoes_estoque FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissao publica vendas" ON public.vendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissao publica itens_venda" ON public.itens_venda FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissao publica fluxo_caixa" ON public.fluxo_caixa FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissao publica usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissao publica auditoria" ON public.historico_auditoria FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- DADOS INICIAIS (SEED DATA)
-- ==============================================================================
INSERT INTO public.usuarios (id, nome, email, role, status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Ana Souza', 'ana@empresa.com.br', 'admin', 'ativo'),
    ('22222222-2222-2222-2222-222222222222', 'Carlos Mendes', 'carlos@empresa.com.br', 'operacional', 'ativo'),
    ('33333333-3333-3333-3333-333333333333', 'Mariana Lima', 'mariana@empresa.com.br', 'operacional', 'inativo')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.produtos (id, nome, tipo, labor_minutes, labor_cost_per_minute, margin_pct, card_fee_pct, logistics_cost) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bolo de Cenoura Premium 1,2kg', 'fabricado', 45, 0.62, 28, 3.99, 6.50),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kit Presente Corporativo', 'fabricado', 18, 0.62, 16, 3.20, 12.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.produtos (id, nome, tipo, supplier_price, freight, purchase_tax, margin_pct, card_fee_pct, logistics_cost) VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Café Especial Torrado 500g', 'revenda', 28.40, 3.20, 2.10, 32, 2.99, 8.90),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Garrafa Térmica Inox 1L', 'revenda', 74.90, 9.40, 6.30, 12, 4.20, 15.00),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Linha Artesanal — Vela de Soja 180g', 'fabricado', 0, 0, 0, 41, 3.50, 7.40)
ON CONFLICT (id) DO NOTHING;

-- Insumos e itens
INSERT INTO public.ficha_tecnica_itens (produto_id, tipo, nome, quantidade, unit_cost) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bom', 'Cenoura orgânica (kg)', 0.4, 8.90),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bom', 'Farinha de trigo (kg)', 0.5, 5.40),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bom', 'Cobertura de chocolate (kg)', 0.3, 32.00),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bom', 'Embalagem rígida', 1.0, 3.75),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'packaging', 'Sacola kraft', 1.0, 1.20),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'packaging', 'Laço decorativo', 1.0, 0.65)
ON CONFLICT DO NOTHING;

-- Estoque inicial
INSERT INTO public.estoque (id, produto_id, nome, tipo, saldo_atual, saldo_minimo, unidade, custo_unitario) VALUES
    ('10000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bolo de Cenoura Premium 1,2kg', 'produto_final', 14, 5, 'un', 15.65),
    ('10000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kit Presente Corporativo', 'produto_final', 4, 8, 'un', 36.56),
    ('10000000-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Café Especial Torrado 500g', 'produto_final', 28, 10, 'un', 35.55),
    ('10000000-0000-0000-0000-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Garrafa Térmica Inox 1L', 'produto_final', 2, 6, 'un', 90.60),
    ('10000000-0000-0000-0000-000000000005', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Linha Artesanal — Vela de Soja 180g', 'produto_final', 19, 5, 'un', 24.82),
    ('10000000-0000-0000-0000-000000000006', NULL, 'Cenoura orgânica', 'insumo', 18.5, 5.0, 'kg', 8.90),
    ('10000000-0000-0000-0000-000000000007', NULL, 'Farinha de trigo', 'insumo', 35.0, 10.0, 'kg', 5.40),
    ('10000000-0000-0000-0000-000000000008', NULL, 'Cobertura de chocolate', 'insumo', 8.2, 3.0, 'kg', 32.00)
ON CONFLICT (id) DO NOTHING;
