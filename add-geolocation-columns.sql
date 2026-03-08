-- ============================================
-- GTX - Adicionar Colunas de Geolocalização
-- ============================================
-- Executar no Supabase SQL Editor
-- Database: Tracking Supabase (cffpqwynoftzqpdkaqoj)
-- ============================================

-- Adicionar colunas de geolocalização na tabela leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS pais TEXT,
ADD COLUMN IF NOT EXISTS pais_codigo TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS estado_codigo TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT;

-- Criar índices para melhorar performance de queries por localização
CREATE INDEX IF NOT EXISTS idx_leads_pais ON public.leads(pais);
CREATE INDEX IF NOT EXISTS idx_leads_estado ON public.leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON public.leads(cidade);

-- Comentários nas colunas
COMMENT ON COLUMN public.leads.pais IS 'País do lead (ex: Brazil)';
COMMENT ON COLUMN public.leads.pais_codigo IS 'Código do país (ex: BR)';
COMMENT ON COLUMN public.leads.estado IS 'Estado do lead (ex: São Paulo)';
COMMENT ON COLUMN public.leads.estado_codigo IS 'Código do estado (ex: SP)';
COMMENT ON COLUMN public.leads.cidade IS 'Cidade do lead (ex: São Paulo)';

-- Verificar estrutura atualizada
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('pais', 'pais_codigo', 'estado', 'estado_codigo', 'cidade')
ORDER BY column_name;

-- Query de teste: Ver distribuição geográfica dos leads
-- (execute DEPOIS de capturar alguns leads)
SELECT
  pais,
  estado,
  cidade,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'qualificado') as qualificados,
  COUNT(*) FILTER (WHERE status = 'fechado') as fechados
FROM public.leads
WHERE pais IS NOT NULL
GROUP BY pais, estado, cidade
ORDER BY total_leads DESC;

-- Query: Top 10 cidades com mais leads
SELECT
  cidade,
  estado,
  COUNT(*) as total_leads
FROM public.leads
WHERE cidade IS NOT NULL
GROUP BY cidade, estado
ORDER BY total_leads DESC
LIMIT 10;

-- Query: Distribuição por estado
SELECT
  estado,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'qualificado') as qualificados,
  COUNT(*) FILTER (WHERE status = 'fechado') as fechados,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'fechado')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as taxa_conversao_percent
FROM public.leads
WHERE estado IS NOT NULL
GROUP BY estado
ORDER BY total_leads DESC;
