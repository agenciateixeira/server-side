/**
 * GTX - Monitor de Leads
 * Monitora o Supabase e envia eventos Purchase automaticamente quando status muda para "fechado"
 */

require('dotenv').config({ path: '../config/.env' });
const { createClient } = require('@supabase/supabase-js');
const { sendEventToCAPI } = require('./meta-capi');

// ============================================
// CONFIGURAÇÕES
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MONITOR_INTERVAL = (process.env.MONITOR_INTERVAL || 5) * 60 * 1000; // Converte minutos para ms

// Valida credenciais
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERRO: SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios no .env');
  process.exit(1);
}

// Cria cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Busca leads que precisam enviar Purchase
 */
async function buscarLeadsFechados() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'fechado')
    .eq('enviado_meta_purchase', false)
    .order('converted_at', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar leads:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Marca lead como enviado no Supabase
 */
async function marcarComoEnviado(leadId) {
  const { error } = await supabase
    .from('leads')
    .update({ enviado_meta_purchase: true })
    .eq('id', leadId);

  if (error) {
    console.error(`❌ Erro ao marcar lead ${leadId} como enviado:`, error.message);
    return false;
  }

  return true;
}

/**
 * Processa um lead fechado e envia Purchase via CAPI
 */
async function processarLeadFechado(lead) {
  console.log(`\n📤 Processando lead ${lead.id}...`);
  console.log(`   Nome: ${lead.nome || 'N/A'}`);
  console.log(`   Email: ${lead.email || 'N/A'}`);
  console.log(`   Valor: R$ ${lead.valor_venda || 0}`);
  console.log(`   Data conversão: ${lead.converted_at || lead.created_at}`);

  // Valida dados essenciais
  if (!lead.fbp && !lead.email && !lead.telefone) {
    console.log('⚠️  Lead sem dados de match (fbp, email ou telefone) - pulando');
    return false;
  }

  // Envia Purchase via CAPI
  const result = await sendEventToCAPI({
    event_name: 'Purchase',
    event_id: `purchase_${lead.id}`,
    fbp: lead.fbp,
    fbc: lead.fbc,
    email: lead.email,
    phone: lead.telefone,
    ip_address: lead.ip_address,
    user_agent: lead.user_agent,
    event_source_url: lead.url_origem || 'https://gtx.com.br',
    value: lead.valor_venda,
    currency: lead.moeda || 'BRL'
  });

  if (result.success) {
    // Marca como enviado
    const marcado = await marcarComoEnviado(lead.id);

    if (marcado) {
      console.log(`✅ Purchase enviado e marcado como concluído!`);
      return true;
    } else {
      console.log(`⚠️  Purchase enviado, mas falha ao marcar no banco`);
      return false;
    }
  } else {
    console.log(`❌ Falha ao enviar Purchase:`, result.error);
    return false;
  }
}

/**
 * Executa monitoramento (busca e processa leads)
 */
async function executarMonitoramento() {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`\n🔍 [${timestamp}] Verificando leads fechados...`);

  try {
    const leadsFechados = await buscarLeadsFechados();

    if (leadsFechados.length === 0) {
      console.log('   Nenhum lead fechado pendente');
      return;
    }

    console.log(`   📊 ${leadsFechados.length} lead(s) encontrado(s) para processar`);

    let sucessos = 0;
    let falhas = 0;

    for (const lead of leadsFechados) {
      const sucesso = await processarLeadFechado(lead);
      if (sucesso) {
        sucessos++;
      } else {
        falhas++;
      }

      // Aguarda 1 segundo entre envios para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n📈 Resumo: ${sucessos} sucesso(s), ${falhas} falha(s)`);

  } catch (error) {
    console.error('❌ Erro durante monitoramento:', error.message);
  }
}

/**
 * Inicia monitoramento contínuo
 */
function iniciarMonitoramento() {
  console.log('🚀 GTX - Monitor de Leads iniciado!');
  console.log(`📊 Supabase: ${SUPABASE_URL}`);
  console.log(`⏰ Intervalo: ${MONITOR_INTERVAL / 60000} minutos`);
  console.log(`🎯 Pixel ID: ${process.env.META_PIXEL_ID}`);
  console.log('─'.repeat(60));

  // Executa imediatamente
  executarMonitoramento();

  // Agenda execuções periódicas
  setInterval(executarMonitoramento, MONITOR_INTERVAL);

  console.log('\n✅ Monitoramento ativo. Pressione Ctrl+C para parar.\n');
}

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', () => {
  console.log('\n\n👋 Encerrando monitor de leads...');
  console.log('✅ Monitor encerrado com sucesso');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Encerrando monitor de leads (SIGTERM)...');
  process.exit(0);
});

// Inicia monitoramento
iniciarMonitoramento();
