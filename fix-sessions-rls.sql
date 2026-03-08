-- ============================================
-- FIX: Permitir UPDATE de sessões com anon key
-- Necessário para markSessionAsConverted() funcionar
-- ============================================

-- Remove a policy antiga que só permitia service_role
DROP POLICY IF EXISTS "Permitir update apenas service_role sessions" ON public.sessions;

-- Cria nova policy que permite anon atualizar suas próprias sessões
CREATE POLICY "Permitir update de sessions com anon"
ON public.sessions FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Também permite service_role (para scripts backend)
CREATE POLICY "Permitir update de sessions com service_role"
ON public.sessions FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Verificar policies criadas
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'sessions'
ORDER BY policyname;
