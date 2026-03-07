/**
 * GTX - Script de Teste
 * Testa envio de eventos para Meta CAPI e integração com Supabase
 */

require('dotenv').config({ path: '../config/.env' });
const { createClient } = require('@supabase/supabase-js');
const { sendEventToCAPI } = require('./meta-capi');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🧪 GTX - Script de Teste\n');
console.log('=' .repeat(60));

/**
 * Teste 1: Conexão com Supabase
 */
async function testeSupabase() {
  console.log('\n📝 Teste 1: Conexão com Supabase');
  console.log('-'.repeat(60));

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Erro ao conectar:', error.message);
      return false;
    }

    console.log('✅ Conexão com Supabase OK');
    return true;

  } catch (error) {
    console.log('❌ Erro:', error.message);
    return false;
  }
}

/**
 * Teste 2: Inserir lead de teste no Supabase
 */
async function testeInserirLead() {
  console.log('\n📝 Teste 2: Inserir lead de teste');
  console.log('-'.repeat(60));

  const leadTeste = {
    nome: 'Teste GTX ' + new Date().toLocaleTimeString(),
    email: 'teste@gtx.com.br',
    telefone: '11999999999',
    fbp: 'fb.1.' + Date.now() + '.987654321',
    fbc: 'fb.1.' + Date.now() + '.IwAR_teste',
    utm_source: 'teste',
    utm_campaign: 'teste-capi',
    status: 'novo',
    ip_address: '200.150.100.50',
    user_agent: 'Mozilla/5.0 Test'
  };

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert(leadTeste)
      .select();

    if (error) {
      console.log('❌ Erro ao inserir:', error.message);
      return null;
    }

    console.log('✅ Lead inserido com sucesso!');
    console.log('   ID:', data[0].id);
    console.log('   Nome:', data[0].nome);
    return data[0];

  } catch (error) {
    console.log('❌ Erro:', error.message);
    return null;
  }
}

/**
 * Teste 3: Enviar evento Lead para Meta CAPI
 */
async function testeEnviarLead(lead) {
  console.log('\n📝 Teste 3: Enviar evento Lead para Meta CAPI');
  console.log('-'.repeat(60));

  if (!lead) {
    console.log('⚠️  Pulando (lead não existe)');
    return false;
  }

  const result = await sendEventToCAPI({
    event_name: 'Lead',
    event_id: `test_lead_${lead.id}`,
    fbp: lead.fbp,
    fbc: lead.fbc,
    email: lead.email,
    phone: lead.telefone,
    ip_address: lead.ip_address,
    user_agent: lead.user_agent,
    event_source_url: 'https://gtx.com.br/teste',
    test_event_code: 'TEST12345' // Use um código de teste válido do Meta
  });

  return result.success;
}

/**
 * Teste 4: Marcar lead como fechado
 */
async function testeMarcarFechado(lead) {
  console.log('\n📝 Teste 4: Marcar lead como fechado');
  console.log('-'.repeat(60));

  if (!lead) {
    console.log('⚠️  Pulando (lead não existe)');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        status: 'fechado',
        valor_venda: 199.90
      })
      .eq('id', lead.id)
      .select();

    if (error) {
      console.log('❌ Erro ao atualizar:', error.message);
      return null;
    }

    console.log('✅ Lead marcado como fechado');
    console.log('   Status:', data[0].status);
    console.log('   Valor:', 'R$', data[0].valor_venda);
    console.log('   Converted at:', data[0].converted_at);
    return data[0];

  } catch (error) {
    console.log('❌ Erro:', error.message);
    return null;
  }
}

/**
 * Teste 5: Enviar evento Purchase para Meta CAPI
 */
async function testeEnviarPurchase(lead) {
  console.log('\n📝 Teste 5: Enviar evento Purchase para Meta CAPI');
  console.log('-'.repeat(60));

  if (!lead) {
    console.log('⚠️  Pulando (lead não existe)');
    return false;
  }

  const result = await sendEventToCAPI({
    event_name: 'Purchase',
    event_id: `test_purchase_${lead.id}`,
    fbp: lead.fbp,
    fbc: lead.fbc,
    email: lead.email,
    phone: lead.telefone,
    ip_address: lead.ip_address,
    user_agent: lead.user_agent,
    event_source_url: 'https://gtx.com.br/teste',
    value: lead.valor_venda,
    currency: 'BRL',
    test_event_code: 'TEST12345' // Use um código de teste válido do Meta
  });

  return result.success;
}

/**
 * Teste 6: Limpar dados de teste
 */
async function testeLimpar(lead) {
  console.log('\n📝 Teste 6: Limpar lead de teste');
  console.log('-'.repeat(60));

  if (!lead) {
    console.log('⚠️  Pulando (lead não existe)');
    return;
  }

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', lead.id);

  if (error) {
    console.log('❌ Erro ao deletar:', error.message);
  } else {
    console.log('✅ Lead de teste removido');
  }
}

/**
 * Executa todos os testes
 */
async function executarTestes() {
  console.log('\n🚀 Iniciando testes...\n');

  let lead = null;

  try {
    // Teste 1: Supabase
    const supabaseOK = await testeSupabase();
    if (!supabaseOK) {
      console.log('\n❌ Testes abortados - Supabase não conectado');
      return;
    }

    // Teste 2: Inserir lead
    lead = await testeInserirLead();

    // Teste 3: Enviar Lead
    await testeEnviarLead(lead);

    // Aguarda 2 segundos
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 4: Marcar como fechado
    lead = await testeMarcarFechado(lead);

    // Teste 5: Enviar Purchase
    await testeEnviarPurchase(lead);

    // Teste 6: Limpar
    console.log('\n⏳ Aguardando 2 segundos antes de limpar...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testeLimpar(lead);

  } catch (error) {
    console.error('\n❌ Erro durante testes:', error.message);
  }

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('✅ Testes concluídos!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Verifique eventos no Meta Events Manager → Test Events');
  console.log('   2. Remova test_event_code dos scripts para produção');
  console.log('   3. Execute: node scripts/monitor-leads.js');
  console.log('='.repeat(60));
}

// Executa os testes
executarTestes();
