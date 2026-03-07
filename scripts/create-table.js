/**
 * GTX - Script para criar tabela leads no Supabase
 */

require('dotenv').config({ path: './config/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createTable() {
  console.log('[GTX] 🔧 Criando tabela leads...\n');

  const sql = `
-- Criar tabela leads
CREATE TABLE IF NOT EXISTS public.leads (
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
  mensagem TEXT,

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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_event_id ON public.leads(event_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_telefone ON public.leads(telefone);

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
    IF NEW.status = 'fechado' AND OLD.status != 'fechado' THEN
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

-- Permitir SELECT apenas com service_role (para scripts de monitoramento)
DROP POLICY IF EXISTS "Permitir select apenas service_role" ON public.leads;
CREATE POLICY "Permitir select apenas service_role"
ON public.leads FOR SELECT
TO service_role
USING (true);

-- Permitir UPDATE apenas com service_role (para scripts de monitoramento)
DROP POLICY IF EXISTS "Permitir update apenas service_role" ON public.leads;
CREATE POLICY "Permitir update apenas service_role"
ON public.leads FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
`;

  try {
    // Executar SQL usando raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se a função exec_sql não existir, tentar criar via REST API
      console.log('[GTX] ⚠️  Função exec_sql não encontrada, criando tabela via REST API...\n');

      // Tentar criar a tabela diretamente
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      });

      console.log('[GTX] ℹ️  Para criar a tabela, você precisa:');
      console.log('');
      console.log('1. Acessar: https://supabase.com/dashboard/project/cffpqwynoftzqpdkaqoj/editor');
      console.log('');
      console.log('2. Clicar em "SQL Editor" no menu lateral');
      console.log('');
      console.log('3. Copiar o conteúdo do arquivo:');
      console.log('   /Users/guilhermeteixeira/Documents/AGENCIA GTX./SERVER-SIDE/templates/supabase-schema.sql');
      console.log('');
      console.log('4. Colar no editor SQL e clicar em "Run"');
      console.log('');
      console.log('✅ Depois disso, a tabela estará criada e pronta para uso!');
      console.log('');

      return;
    }

    console.log('[GTX] ✅ Tabela leads criada com sucesso!');
    console.log('');
    console.log('Estrutura:');
    console.log('- 20+ campos para tracking completo');
    console.log('- Índices para performance');
    console.log('- Triggers automáticos para updated_at e converted_at');
    console.log('- RLS ativado para segurança');
    console.log('');

  } catch (error) {
    console.error('[GTX] ❌ Erro:', error.message);
    console.log('');
    console.log('[GTX] ℹ️  Para criar a tabela manualmente:');
    console.log('');
    console.log('1. Acesse: https://supabase.com/dashboard/project/cffpqwynoftzqpdkaqoj/editor');
    console.log('');
    console.log('2. Clique em "SQL Editor" no menu lateral');
    console.log('');
    console.log('3. Copie o conteúdo do arquivo:');
    console.log('   /Users/guilhermeteixeira/Documents/AGENCIA GTX./SERVER-SIDE/templates/supabase-schema.sql');
    console.log('');
    console.log('4. Cole no editor SQL e clique em "Run"');
    console.log('');
  }
}

createTable();
