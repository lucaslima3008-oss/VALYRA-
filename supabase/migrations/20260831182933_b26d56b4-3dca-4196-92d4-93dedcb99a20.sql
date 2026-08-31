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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO anon, authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao publica produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ficha_tecnica_itens TO anon, authenticated;
GRANT ALL ON public.ficha_tecnica_itens TO service_role;
ALTER TABLE public.ficha_tecnica_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao publica ficha" ON public.ficha_tecnica_itens FOR ALL USING (true) WITH CHECK (true);

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO anon, authenticated;
GRANT ALL ON public.estoque TO service_role;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao publica estoque" ON public.estoque FOR ALL USING (true) WITH CHECK (true);

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_estoque TO anon, authenticated;
GRANT ALL ON public.movimentacoes_estoque TO service_role;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao publica movimentacoes" ON public.movimentacoes_estoque FOR ALL USING (true) WITH CHECK (true);

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas TO anon, authenticated;
GRANT ALL ON public.vendas TO service_role;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao publica vendas" ON public.vendas FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS status_pagamento text
    CHECK (status_pagamento IN ('pendente','pago','expirado','cancelado')),
  ADD COLUMN IF NOT EXISTS mp_preference_id text,
  ADD COLUMN IF NOT EXISTS mp_payment_id text,
  ADD COLUMN IF NOT EXISTS mp_link_pagamento text;

CREATE UNIQUE INDEX IF NOT EXISTS vendas_codigo_key ON public.vendas (codigo);
CREATE INDEX IF NOT EXISTS vendas_status_pagamento_idx ON public.vendas (status_pagamento);
ALTER TABLE public.vendas REPLICA IDENTITY FULL;

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_venda TO anon, authenticated;
GRANT ALL ON public.itens_venda TO service_role;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao publica itens_venda" ON public.itens_venda FOR ALL USING (true) WITH CHECK (true);

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fluxo_caixa TO anon, authenticated;
GRANT ALL ON public.fluxo_caixa TO service_role;
ALTER TABLE public.fluxo_caixa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao publica fluxo_caixa" ON public.fluxo_caixa FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operacional')),
    status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios TO anon, authenticated;
GRANT ALL ON public.usuarios TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao publica usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_auditoria TO anon, authenticated;
GRANT ALL ON public.historico_auditoria TO service_role;
ALTER TABLE public.historico_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao publica auditoria" ON public.historico_auditoria FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.configuracoes_pagamento (
    chave TEXT PRIMARY KEY,
    valor TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT ALL ON public.configuracoes_pagamento TO service_role;
ALTER TABLE public.configuracoes_pagamento ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.maquininhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apelido TEXT NOT NULL,
    modelo TEXT,
    adquirente TEXT,
    numero_serie TEXT,
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maquininhas TO anon, authenticated;
GRANT ALL ON public.maquininhas TO service_role;
ALTER TABLE public.maquininhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao publica maquininhas" ON public.maquininhas FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.usuarios (nome, email, role, status) VALUES
    ('Lucas Lima', 'lucas.lima@costprice.com', 'admin', 'ativo')
ON CONFLICT (email) DO NOTHING;