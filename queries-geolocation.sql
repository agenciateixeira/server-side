-- ============================================
-- GTX - Queries de Análise Geográfica
-- ============================================
-- Copie e cole no Supabase SQL Editor
-- ============================================

-- 1. Ver todos os leads com geolocalização
SELECT
  id,
  nome,
  email,
  cidade,
  estado,
  pais,
  status,
  ip_address,
  created_at
FROM leads
WHERE cidade IS NOT NULL
ORDER BY created_at DESC;

-- ============================================

-- 2. Distribuição de leads por estado
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
FROM leads
WHERE estado IS NOT NULL
GROUP BY estado
ORDER BY total_leads DESC;

-- ============================================

-- 3. Top 10 cidades com mais leads
SELECT
  cidade,
  estado,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'qualificado') as qualificados,
  COUNT(*) FILTER (WHERE status = 'fechado') as fechados
FROM leads
WHERE cidade IS NOT NULL
GROUP BY cidade, estado
ORDER BY total_leads DESC
LIMIT 10;

-- ============================================

-- 4. Análise completa: Leads por cidade com valores
SELECT
  cidade,
  estado,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'novo') as novos,
  COUNT(*) FILTER (WHERE status = 'qualificado') as qualificados,
  COUNT(*) FILTER (WHERE status = 'fechado') as fechados,
  COALESCE(SUM(valor_venda), 0) as receita_total,
  COALESCE(ROUND(AVG(valor_venda), 2), 0) as ticket_medio
FROM leads
WHERE cidade IS NOT NULL
GROUP BY cidade, estado
ORDER BY total_leads DESC;

-- ============================================

-- 5. Leads SEM geolocalização (para backfill)
SELECT
  COUNT(*) as total_sem_geo,
  COUNT(*) FILTER (WHERE ip_address IS NOT NULL) as tem_ip_mas_sem_geo
FROM leads
WHERE cidade IS NULL;

-- ============================================

-- 6. Percentual de leads com geolocalização
SELECT
  COUNT(*) as total_leads,
  COUNT(cidade) as leads_com_geo,
  ROUND(
    COUNT(cidade)::numeric / COUNT(*) * 100,
    2
  ) as percentual_com_geo
FROM leads;

-- ============================================

-- 7. Mapa de calor: Estados ordenados por receita
SELECT
  estado,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'fechado') as vendas,
  COALESCE(SUM(valor_venda), 0) as receita_total,
  COALESCE(ROUND(AVG(valor_venda), 2), 0) as ticket_medio,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'fechado')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as taxa_conversao
FROM leads
WHERE estado IS NOT NULL
GROUP BY estado
ORDER BY receita_total DESC;

-- ============================================

-- 8. Exportar para criar público personalizado no Meta (CSV)
-- Use isso para criar Custom Audience por região
SELECT
  email,
  nome,
  telefone,
  cidade,
  estado,
  status
FROM leads
WHERE estado = 'São Paulo'  -- Mude para o estado desejado
  AND email IS NOT NULL
  AND status IN ('qualificado', 'fechado')
ORDER BY created_at DESC;
