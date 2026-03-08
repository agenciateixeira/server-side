-- ============================================
-- GTX - Schema da tabela LEADS (ATUALIZADO)
-- Versão: 2.0 - Com coluna MENSAGEM
-- ============================================

-- Drop tabela existente (se houver) e recria do zero
DROP TABLE IF EXISTS public.leads CASCADE;

-- Criar tabela leads
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Dados de Tracking (Meta)
  fbp TEXT,
  fbc TEXT,
  event_id TEXT UNIQUE,

  -- Dados de Tracking (Google)
  gclid TEXT,

  -- Dados do Lead
  nome TEXT,
  email TEXT,
  telefone TEXT,
  mensagem TEXT, -- ← COLUNA QUE ESTAVA FALTANDO!

  -- UTMs
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Dados Técnicos
  user_agent TEXT,
  ip_address TEXT,
  url_origem TEXT,
  origem TEXT, -- De onde veio (landing_page_modal, etc)

  -- Status e Valor
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'qualificado', 'proposta_enviada', 'fechado', 'perdido')),
  valor_venda DECIMAL(10, 2),

  -- Controle de Envio
  enviado_meta_lead BOOLEAN DEFAULT FALSE,
  enviado_meta_purchase BOOLEAN DEFAULT FALSE,
  enviado_google BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Comentários nas colunas
COMMENT ON TABLE public.leads IS 'Tabela de leads capturados via tracking server-side';
COMMENT ON COLUMN public.leads.mensagem IS 'Mensagem enviada pelo usuário no formulário/WhatsApp';
COMMENT ON COLUMN public.leads.origem IS 'Origem do lead: landing_page_modal, formulario_contato, etc';
COMMENT ON COLUMN public.leads.event_id IS 'Event ID único para deduplicação entre client-side e server-side';
COMMENT ON COLUMN public.leads.fbp IS 'Cookie _fbp do Meta Pixel';
COMMENT ON COLUMN public.leads.fbc IS 'Cookie _fbc do Meta Pixel (click ID)';

-- Índices para performance
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_event_id ON public.leads(event_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_telefone ON public.leads(telefone);
CREATE INDEX idx_leads_origem ON public.leads(origem);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('America/Sao_Paulo', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para marcar converted_at quando status = 'fechado'
CREATE OR REPLACE FUNCTION update_converted_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'fechado' AND (OLD.status IS NULL OR OLD.status != 'fechado') THEN
        NEW.converted_at = TIMEZONE('America/Sao_Paulo', NOW());
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_converted_at ON public.leads;
CREATE TRIGGER update_leads_converted_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_converted_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT com anon key (para landing page salvar leads)
DROP POLICY IF EXISTS "Permitir insert de leads" ON public.leads;
CREATE POLICY "Permitir insert de leads"
ON public.leads FOR INSERT
TO anon
WITH CHECK (true);

-- Permitir SELECT com anon key (para landing page consultar)
DROP POLICY IF EXISTS "Permitir select de leads" ON public.leads;
CREATE POLICY "Permitir select de leads"
ON public.leads FOR SELECT
TO anon
USING (true);

-- Permitir UPDATE apenas com service_role (para scripts de monitoramento)
DROP POLICY IF EXISTS "Permitir update apenas service_role" ON public.leads;
CREATE POLICY "Permitir update apenas service_role"
ON public.leads FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Permitir DELETE apenas com service_role
DROP POLICY IF EXISTS "Permitir delete apenas service_role" ON public.leads;
CREATE POLICY "Permitir delete apenas service_role"
ON public.leads FOR DELETE
TO service_role
USING (true);

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela LEADS criada com sucesso!';
    RAISE NOTICE '📊 Colunas: 24 campos incluindo MENSAGEM e ORIGEM';
    RAISE NOTICE '🔐 RLS ativado com policies configuradas';
    RAISE NOTICE '⚡ Triggers automáticos criados';
    RAISE NOTICE '📈 Índices de performance criados';
END $$;
