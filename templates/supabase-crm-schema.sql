-- ============================================
-- GTX - CRM COMPLETO
-- Sistema de Qualificação e Pipeline de Vendas
-- ============================================

-- ENUM para estágios do funil
DO $$ BEGIN
    CREATE TYPE lead_stage AS ENUM (
        'novo',                  -- Acabou de preencher formulário
        'contatado',            -- Já fez primeiro contato
        'qualificado',          -- Lead qualificado (BANT)
        'reuniao_agendada',     -- Reunião marcada
        'reuniao_realizada',    -- Reunião aconteceu
        'proposta_enviada',     -- Proposta comercial enviada
        'negociacao',           -- Em negociação
        'fechado',              -- GANHOU! 🎉
        'perdido'               -- Perdeu :(
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ENUM para tipo de negócio
DO $$ BEGIN
    CREATE TYPE business_type AS ENUM (
        'ecommerce',
        'restaurante',
        'food',
        'servicos',
        'saude',
        'clinica',
        'educacao',
        'imobiliaria',
        'industria',
        'outros'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ENUM para nível de prioridade
DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM (
        'baixa',
        'media',
        'alta',
        'urgente'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ATUALIZAR TABELA LEADS
-- ============================================

-- Atualizar status para usar ENUM
DO $$
BEGIN
    -- Adicionar novas colunas na tabela leads
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'stage') THEN
        ALTER TABLE public.leads ADD COLUMN stage lead_stage DEFAULT 'novo';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'prioridade') THEN
        ALTER TABLE public.leads ADD COLUMN prioridade priority_level DEFAULT 'media';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'responsavel') THEN
        ALTER TABLE public.leads ADD COLUMN responsavel TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'notas') THEN
        ALTER TABLE public.leads ADD COLUMN notas TEXT;
    END IF;
END $$;

-- ============================================
-- TABELA DE QUALIFICAÇÃO (BANT)
-- ============================================

CREATE TABLE IF NOT EXISTS public.lead_qualification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,

    -- BANT Framework
    budget_mensal DECIMAL(10, 2),           -- Budget: Quanto tem para investir?
    faturamento_mensal DECIMAL(10, 2),      -- Autoridade: Tamanho da empresa
    tipo_negocio business_type,             -- Need: Tipo de negócio
    dor_principal TEXT,                     -- Need: Principal problema
    objetivo TEXT,                          -- Need: O que quer alcançar
    urgencia TEXT,                          -- Timeline: Quando quer começar?
    decisor TEXT,                           -- Authority: Quem decide?
    cargo_decisor TEXT,                     -- Authority: Cargo do decisor

    -- Fit Score (0-100)
    fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
    motivo_fit TEXT,                        -- Por que esse score?

    -- Qualificação
    is_qualified BOOLEAN DEFAULT FALSE,
    qualified_at TIMESTAMP WITH TIME ZONE,
    qualified_by TEXT,                      -- Quem qualificou

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

CREATE INDEX idx_qualification_lead_id ON public.lead_qualification(lead_id);
CREATE INDEX idx_qualification_qualified ON public.lead_qualification(is_qualified);
CREATE INDEX idx_qualification_fit_score ON public.lead_qualification(fit_score);

COMMENT ON TABLE public.lead_qualification IS 'Dados de qualificação BANT do lead';
COMMENT ON COLUMN public.lead_qualification.fit_score IS 'Score de 0-100 indicando fit do lead';

-- ============================================
-- TABELA DE REUNIÕES
-- ============================================

CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,

    -- Dados da reunião
    titulo TEXT NOT NULL,
    descricao TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,

    -- Local/Link
    tipo TEXT CHECK (tipo IN ('presencial', 'online', 'telefone')),
    link TEXT,                              -- Link Zoom/Meet
    endereco TEXT,                          -- Se presencial

    -- Status
    status TEXT CHECK (status IN ('agendada', 'confirmada', 'realizada', 'cancelada', 'remarcada')) DEFAULT 'agendada',
    realizada_at TIMESTAMP WITH TIME ZONE,

    -- Participantes
    participantes TEXT[],                   -- Array de nomes

    -- Resultado
    resultado TEXT,                         -- Como foi a reunião?
    proximos_passos TEXT,                   -- Next steps

    -- Responsável
    responsavel TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

CREATE INDEX idx_meetings_lead_id ON public.meetings(lead_id);
CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON public.meetings(status);

COMMENT ON TABLE public.meetings IS 'Reuniões agendadas e realizadas com leads';

-- ============================================
-- TABELA DE PROPOSTAS
-- ============================================

CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,

    -- Dados da proposta
    titulo TEXT NOT NULL,
    descricao TEXT,
    valor_proposta DECIMAL(10, 2) NOT NULL,
    valor_desconto DECIMAL(10, 2) DEFAULT 0,
    valor_final DECIMAL(10, 2) NOT NULL,

    -- Condições
    prazo_validade DATE,
    forma_pagamento TEXT,
    condicoes TEXT,

    -- Serviços inclusos
    servicos TEXT[],                        -- Array de serviços

    -- Arquivos
    link_proposta TEXT,                     -- Link do PDF/Doc

    -- Status
    status TEXT CHECK (status IN ('enviada', 'visualizada', 'em_analise', 'aprovada', 'recusada', 'expirada')) DEFAULT 'enviada',
    enviada_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    visualizada_at TIMESTAMP WITH TIME ZONE,
    respondida_at TIMESTAMP WITH TIME ZONE,

    -- Feedback
    motivo_recusa TEXT,
    observacoes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

CREATE INDEX idx_proposals_lead_id ON public.proposals(lead_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_valor_final ON public.proposals(valor_final);

COMMENT ON TABLE public.proposals IS 'Propostas comerciais enviadas';

-- ============================================
-- TABELA DE NEGÓCIOS FECHADOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.proposals(id),

    -- Valor do negócio
    valor_contratado DECIMAL(10, 2) NOT NULL,
    valor_mensal_recorrente DECIMAL(10, 2),  -- MRR

    -- Datas
    fechado_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    inicio_contrato DATE,
    fim_contrato DATE,

    -- Detalhes
    servicos_contratados TEXT[],
    observacoes TEXT,

    -- Responsável pela venda
    vendedor TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

CREATE INDEX idx_deals_lead_id ON public.deals(lead_id);
CREATE INDEX idx_deals_fechado_at ON public.deals(fechado_at);
CREATE INDEX idx_deals_valor_contratado ON public.deals(valor_contratado);

COMMENT ON TABLE public.deals IS 'Negócios fechados (clientes conquistados)';

-- ============================================
-- TABELA DE INTERAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,

    -- Tipo de interação
    tipo TEXT CHECK (tipo IN ('chamada', 'email', 'whatsapp', 'reuniao', 'proposta', 'outro')) NOT NULL,

    -- Conteúdo
    titulo TEXT,
    descricao TEXT NOT NULL,

    -- Resultado
    resultado TEXT,
    proxima_acao TEXT,
    data_proxima_acao DATE,

    -- Responsável
    responsavel TEXT,

    -- Timestamp
    ocorreu_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

CREATE INDEX idx_interactions_lead_id ON public.interactions(lead_id);
CREATE INDEX idx_interactions_tipo ON public.interactions(tipo);
CREATE INDEX idx_interactions_ocorreu_em ON public.interactions(ocorreu_em);

COMMENT ON TABLE public.interactions IS 'Histórico de todas as interações com o lead';

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Atualizar updated_at nas novas tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('America/Sao_Paulo', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_qualification_updated_at ON public.lead_qualification;
CREATE TRIGGER update_qualification_updated_at BEFORE UPDATE ON public.lead_qualification
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON public.meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON public.proposals;
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS DE ANÁLISE
-- ============================================

-- View: Pipeline de Vendas
CREATE OR REPLACE VIEW public.sales_pipeline AS
SELECT
    l.id as lead_id,
    l.nome,
    l.telefone,
    l.email,
    l.stage,
    l.prioridade,
    l.responsavel,
    l.created_at as lead_created_at,

    -- Qualificação
    lq.is_qualified,
    lq.fit_score,
    lq.budget_mensal,
    lq.tipo_negocio,

    -- Próxima reunião
    (SELECT MIN(m.scheduled_at) FROM public.meetings m
     WHERE m.lead_id = l.id AND m.status IN ('agendada', 'confirmada')) as proxima_reuniao,

    -- Última proposta
    (SELECT p.valor_final FROM public.proposals p
     WHERE p.lead_id = l.id ORDER BY p.created_at DESC LIMIT 1) as ultima_proposta_valor,
    (SELECT p.status FROM public.proposals p
     WHERE p.lead_id = l.id ORDER BY p.created_at DESC LIMIT 1) as ultima_proposta_status,

    -- Tempo no funil
    EXTRACT(DAY FROM (NOW() - l.created_at)) as dias_no_funil

FROM public.leads l
LEFT JOIN public.lead_qualification lq ON lq.lead_id = l.id
WHERE l.stage != 'fechado' AND l.stage != 'perdido'
ORDER BY l.prioridade DESC, l.created_at DESC;

COMMENT ON VIEW public.sales_pipeline IS 'Pipeline de vendas com todos os leads ativos';

-- View: Relatório de Conversão
CREATE OR REPLACE VIEW public.conversion_report AS
SELECT
    DATE_TRUNC('month', l.created_at) as mes,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE lq.is_qualified = true) as leads_qualificados,
    COUNT(*) FILTER (WHERE l.stage = 'fechado') as leads_fechados,
    SUM(d.valor_contratado) FILTER (WHERE l.stage = 'fechado') as receita_total,
    ROUND(AVG(d.valor_contratado) FILTER (WHERE l.stage = 'fechado'), 2) as ticket_medio,
    ROUND(
        (COUNT(*) FILTER (WHERE l.stage = 'fechado')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_conversao
FROM public.leads l
LEFT JOIN public.lead_qualification lq ON lq.lead_id = l.id
LEFT JOIN public.deals d ON d.lead_id = l.id
GROUP BY DATE_TRUNC('month', l.created_at)
ORDER BY mes DESC;

COMMENT ON VIEW public.conversion_report IS 'Relatório mensal de conversão e receita';

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.lead_qualification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Policies: Service role pode tudo
CREATE POLICY "Service role full access qualification" ON public.lead_qualification FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access meetings" ON public.meetings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access proposals" ON public.proposals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access deals" ON public.deals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access interactions" ON public.interactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ CRM Completo criado com sucesso!';
    RAISE NOTICE '📊 Tabelas: lead_qualification, meetings, proposals, deals, interactions';
    RAISE NOTICE '📈 Views: sales_pipeline, conversion_report';
    RAISE NOTICE '🔐 RLS e triggers configurados';
END $$;
