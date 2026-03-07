-- ============================================
-- GTX - Schema do Supabase
-- Tabela de leads com tracking completo
-- ============================================

-- Criar tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
    -- Identificação única
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Parâmetros de tracking (essenciais para CAPI)
    fbp TEXT,           -- Facebook Browser Pixel (_fbp cookie)
    fbc TEXT,           -- Facebook Click ID (_fbc cookie)
    gclid TEXT,         -- Google Click ID
    event_id TEXT,      -- ID único do evento (para deduplicação)

    -- Dados do lead
    nome TEXT,
    email TEXT,
    telefone TEXT,

    -- Dados de origem do tráfego
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,

    -- Dados técnicos (para enriquecimento do evento)
    user_agent TEXT,    -- Navegador e dispositivo
    ip_address INET,    -- IP do usuário
    url_origem TEXT,    -- URL da página onde clicou

    -- Status do lead (para gestão)
    status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'qualificado', 'proposta_enviada', 'fechado', 'perdido')),

    -- Dados de conversão
    valor_venda DECIMAL(10, 2),
    moeda TEXT DEFAULT 'BRL',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contatado_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,

    -- Controle de envio para APIs
    enviado_meta_lead BOOLEAN DEFAULT FALSE,
    enviado_meta_purchase BOOLEAN DEFAULT FALSE,
    enviado_google_lead BOOLEAN DEFAULT FALSE,
    enviado_google_purchase BOOLEAN DEFAULT FALSE,

    -- Observações
    observacoes TEXT
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_fbp ON public.leads(fbp);
CREATE INDEX IF NOT EXISTS idx_leads_fbc ON public.leads(fbc);
CREATE INDEX IF NOT EXISTS idx_leads_gclid ON public.leads(gclid);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- Criar trigger para atualizar converted_at automaticamente
CREATE OR REPLACE FUNCTION update_converted_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'fechado' AND OLD.status != 'fechado' THEN
        NEW.converted_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_converted_at ON public.leads;

CREATE TRIGGER trigger_update_converted_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_converted_at();

-- Comentários nas colunas (documentação)
COMMENT ON TABLE public.leads IS 'Tabela de leads capturados via tráfego pago';
COMMENT ON COLUMN public.leads.fbp IS 'Cookie _fbp do Facebook (necessário para CAPI)';
COMMENT ON COLUMN public.leads.fbc IS 'Cookie _fbc do Facebook com click_id (necessário para CAPI)';
COMMENT ON COLUMN public.leads.gclid IS 'Google Click ID para Enhanced Conversions';
COMMENT ON COLUMN public.leads.event_id IS 'ID único para deduplicação entre client-side e server-side';
COMMENT ON COLUMN public.leads.status IS 'Status do lead no funil: novo → contatado → qualificado → proposta_enviada → fechado/perdido';

-- ============================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT público (para capturar leads via landing page)
DROP POLICY IF EXISTS "Permitir INSERT público" ON public.leads;
CREATE POLICY "Permitir INSERT público"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

-- Permitir SELECT com service_role (para scripts de servidor)
DROP POLICY IF EXISTS "Permitir SELECT com service_role" ON public.leads;
CREATE POLICY "Permitir SELECT com service_role"
ON public.leads
FOR SELECT
TO service_role
USING (true);

-- Permitir UPDATE com service_role
DROP POLICY IF EXISTS "Permitir UPDATE com service_role" ON public.leads;
CREATE POLICY "Permitir UPDATE com service_role"
ON public.leads
FOR UPDATE
TO service_role
USING (true);

-- Permitir DELETE com service_role
DROP POLICY IF EXISTS "Permitir DELETE com service_role" ON public.leads;
CREATE POLICY "Permitir DELETE com service_role"
ON public.leads
FOR DELETE
TO service_role
USING (true);

-- ============================================
-- DADOS DE TESTE (Opcional - Comentar em produção)
-- ============================================

-- Inserir um lead de teste
INSERT INTO public.leads (
    nome,
    email,
    telefone,
    fbp,
    fbc,
    utm_source,
    utm_campaign,
    status,
    valor_venda
) VALUES (
    'João Teste GTX',
    'joao@teste.com',
    '11999999999',
    'fb.1.1234567890.987654321',
    'fb.1.1234567890.IwAR123456',
    'facebook',
    'teste-capi',
    'novo',
    150.00
) ON CONFLICT DO NOTHING;

-- Verificar se a tabela foi criada corretamente
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Exibir resumo
SELECT
    status,
    COUNT(*) as total
FROM public.leads
GROUP BY status;
