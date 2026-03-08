-- ============================================
-- GTX - Schema de SESSÕES e USER JOURNEY
-- Rastreia quantas vezes usuário visitou o site
-- ============================================

-- Tabela de SESSÕES (cada visita ao site)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identificação do usuário
  gtx_uid TEXT NOT NULL, -- Cookie único do usuário (_gtx_uid)
  session_id TEXT NOT NULL, -- ID único desta sessão

  -- Dados da visita
  landing_page TEXT, -- Primeira página que visitou
  referrer TEXT, -- De onde veio (google, facebook, direto, etc)

  -- UTMs
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Dados de tracking
  gclid TEXT, -- Google Click ID
  fbclid TEXT, -- Facebook Click ID
  fbp TEXT, -- Cookie _fbp
  fbc TEXT, -- Cookie _fbc

  -- Dados técnicos
  user_agent TEXT,
  ip_address TEXT,
  device_type TEXT, -- mobile, desktop, tablet
  browser TEXT, -- chrome, safari, firefox
  os TEXT, -- windows, mac, android, ios

  -- Dados da sessão
  session_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW()),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER, -- Duração da sessão em segundos
  pages_viewed INTEGER DEFAULT 1, -- Quantas páginas visitou nesta sessão

  -- Conversão
  converted BOOLEAN DEFAULT FALSE, -- Virou lead nesta sessão?
  lead_id UUID REFERENCES public.leads(id), -- Se converteu, qual lead?

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Sao_Paulo', NOW())
);

-- Índices para performance
CREATE INDEX idx_sessions_gtx_uid ON public.sessions(gtx_uid);
CREATE INDEX idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX idx_sessions_created_at ON public.sessions(created_at);
CREATE INDEX idx_sessions_converted ON public.sessions(converted);
CREATE INDEX idx_sessions_lead_id ON public.sessions(lead_id);

-- Comentários
COMMENT ON TABLE public.sessions IS 'Rastreia cada visita (sessão) do usuário ao site';
COMMENT ON COLUMN public.sessions.gtx_uid IS 'Cookie único do usuário - persiste por 365 dias';
COMMENT ON COLUMN public.sessions.session_id IS 'ID único desta sessão específica';
COMMENT ON COLUMN public.sessions.converted IS 'TRUE se virou lead nesta sessão';

-- ============================================
-- ATUALIZAR TABELA LEADS
-- Adicionar gtx_uid para vincular com sessões
-- ============================================

-- Adicionar coluna gtx_uid na tabela leads (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'gtx_uid'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN gtx_uid TEXT;
        CREATE INDEX idx_leads_gtx_uid ON public.leads(gtx_uid);
        COMMENT ON COLUMN public.leads.gtx_uid IS 'Cookie único do usuário - vincula com tabela sessions';
    END IF;
END $$;

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT com anon key (para salvar sessões)
DROP POLICY IF EXISTS "Permitir insert de sessions" ON public.sessions;
CREATE POLICY "Permitir insert de sessions"
ON public.sessions FOR INSERT
TO anon
WITH CHECK (true);

-- Permitir SELECT com anon key (para consultar sessões)
DROP POLICY IF EXISTS "Permitir select de sessions" ON public.sessions;
CREATE POLICY "Permitir select de sessions"
ON public.sessions FOR SELECT
TO anon
USING (true);

-- Permitir UPDATE apenas com service_role
DROP POLICY IF EXISTS "Permitir update apenas service_role sessions" ON public.sessions;
CREATE POLICY "Permitir update apenas service_role sessions"
ON public.sessions FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- VIEWS ÚTEIS PARA ANÁLISE
-- ============================================

-- View: Usuários com contagem de sessões
CREATE OR REPLACE VIEW public.user_journey_stats AS
SELECT
  s.gtx_uid,
  COUNT(s.id) as total_sessions,
  MIN(s.created_at) as first_visit,
  MAX(s.created_at) as last_visit,
  SUM(s.pages_viewed) as total_pages_viewed,
  SUM(s.duration_seconds) as total_time_seconds,
  BOOL_OR(s.converted) as has_converted,
  (SELECT l2.id FROM public.leads l2 WHERE l2.gtx_uid = s.gtx_uid ORDER BY l2.created_at DESC LIMIT 1) as lead_id,
  (SELECT l2.nome FROM public.leads l2 WHERE l2.gtx_uid = s.gtx_uid ORDER BY l2.created_at DESC LIMIT 1) as lead_nome,
  (SELECT l2.email FROM public.leads l2 WHERE l2.gtx_uid = s.gtx_uid ORDER BY l2.created_at DESC LIMIT 1) as lead_email,
  (SELECT l2.telefone FROM public.leads l2 WHERE l2.gtx_uid = s.gtx_uid ORDER BY l2.created_at DESC LIMIT 1) as lead_telefone,
  (SELECT l2.status FROM public.leads l2 WHERE l2.gtx_uid = s.gtx_uid ORDER BY l2.created_at DESC LIMIT 1) as lead_status
FROM public.sessions s
GROUP BY s.gtx_uid
ORDER BY first_visit DESC;

COMMENT ON VIEW public.user_journey_stats IS 'Estatísticas de jornada: quantas sessões até converter';

-- View: Sessions antes da conversão
CREATE OR REPLACE VIEW public.sessions_before_conversion AS
SELECT
  l.id as lead_id,
  l.nome,
  l.email,
  l.telefone,
  l.gtx_uid,
  l.created_at as conversion_date,
  COUNT(s.id) as sessions_before_conversion,
  MIN(s.created_at) as first_touch,
  MAX(s.created_at) as last_touch,
  EXTRACT(EPOCH FROM (l.created_at - MIN(s.created_at)))/3600 as hours_to_convert
FROM public.leads l
LEFT JOIN public.sessions s ON s.gtx_uid = l.gtx_uid AND s.created_at < l.created_at
GROUP BY l.id, l.nome, l.email, l.telefone, l.gtx_uid, l.created_at
ORDER BY l.created_at DESC;

COMMENT ON VIEW public.sessions_before_conversion IS 'Quantas sessões o usuário teve antes de converter';

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela SESSIONS criada com sucesso!';
    RAISE NOTICE '✅ Coluna gtx_uid adicionada na tabela LEADS';
    RAISE NOTICE '✅ Views de análise criadas';
    RAISE NOTICE '📊 User Journey Tracking configurado!';
END $$;
