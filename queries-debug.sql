-- ============================================
-- QUERIES DE DEBUG - GTX TRACKING
-- ============================================

-- 1️⃣ VER TODAS AS SESSÕES (mais recentes primeiro)
SELECT
  id,
  gtx_uid,
  session_id,
  landing_page,
  referrer,
  utm_source,
  utm_medium,
  utm_campaign,
  device_type,
  browser,
  converted,
  lead_id,
  created_at
FROM public.sessions
ORDER BY created_at DESC
LIMIT 20;

-- 2️⃣ VER TODOS OS LEADS (mais recentes primeiro)
SELECT
  id,
  gtx_uid,
  nome,
  telefone,
  email,
  mensagem,
  origem,
  status,
  fbp,
  fbc,
  event_id,
  created_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 20;

-- 3️⃣ VERIFICAR VINCULAÇÃO - Leads que NÃO estão vinculados a sessões
SELECT
  l.id as lead_id,
  l.nome,
  l.telefone,
  l.gtx_uid,
  l.created_at as lead_created_at,
  s.id as session_id,
  s.session_id as session_identifier,
  s.converted as session_converted,
  s.lead_id as session_lead_id
FROM public.leads l
LEFT JOIN public.sessions s ON s.gtx_uid = l.gtx_uid
ORDER BY l.created_at DESC
LIMIT 10;

-- 4️⃣ SESSÕES SEM CONVERSÃO (mas que deveriam ter)
-- Busca sessões onde existe lead com mesmo gtx_uid mas sessão não foi marcada
SELECT
  s.id,
  s.gtx_uid,
  s.session_id,
  s.converted,
  s.lead_id,
  s.created_at as session_created,
  l.id as lead_exists,
  l.nome as lead_nome,
  l.created_at as lead_created
FROM public.sessions s
LEFT JOIN public.leads l ON l.gtx_uid = s.gtx_uid
WHERE s.converted = false
  AND l.id IS NOT NULL
ORDER BY s.created_at DESC;

-- 5️⃣ ÚLTIMO LEAD + SUA SESSÃO (para debug)
WITH last_lead AS (
  SELECT * FROM public.leads ORDER BY created_at DESC LIMIT 1
)
SELECT
  ll.id as lead_id,
  ll.nome,
  ll.telefone,
  ll.gtx_uid,
  ll.event_id,
  ll.created_at as lead_created_at,
  s.id as session_db_id,
  s.session_id,
  s.converted,
  s.lead_id as session_lead_id,
  s.created_at as session_created_at
FROM last_lead ll
LEFT JOIN public.sessions s ON s.gtx_uid = ll.gtx_uid
ORDER BY s.created_at DESC;

-- 6️⃣ ESTATÍSTICAS GERAIS
SELECT
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE converted = true) as sessions_converted,
  COUNT(*) FILTER (WHERE converted = false) as sessions_not_converted,
  COUNT(DISTINCT gtx_uid) as unique_users,
  (SELECT COUNT(*) FROM public.leads) as total_leads
FROM public.sessions;

-- 7️⃣ CORRIGIR SESSÕES NÃO VINCULADAS (EXECUTAR SE NECESSÁRIO)
-- Este UPDATE vincula sessões antigas que não foram marcadas como convertidas
/*
UPDATE public.sessions s
SET
  converted = true,
  lead_id = l.id
FROM public.leads l
WHERE s.gtx_uid = l.gtx_uid
  AND s.converted = false
  AND s.created_at <= l.created_at
  AND l.created_at - s.created_at < INTERVAL '1 hour';
*/

-- 8️⃣ VER SESSÕES DE UM USUÁRIO ESPECÍFICO (substitua o gtx_uid)
/*
SELECT
  id,
  session_id,
  landing_page,
  referrer,
  utm_source,
  device_type,
  browser,
  converted,
  lead_id,
  created_at
FROM public.sessions
WHERE gtx_uid = 'SEU_GTX_UID_AQUI'
ORDER BY created_at DESC;
*/
