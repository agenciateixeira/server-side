/**
 * GTX - Sync Leads to Meta CAPI
 *
 * Este script busca leads no Supabase e envia para Meta CAPI
 * com filtros de qualificação configuráveis.
 *
 * Executar: node scripts/sync-leads-to-meta.js
 */

require('dotenv').config({ path: './config/.env' });
const crypto = require('crypto');

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG = {
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Meta
  pixelId: process.env.META_PIXEL_ID,
  accessToken: process.env.META_ACCESS_TOKEN,

  // Filtros de qualificação
  filters: {
    // Enviar apenas leads que ainda não foram enviados
    onlyNotSent: true,

    // Enviar apenas leads com email preenchido (melhora Event Match Quality)
    requireEmail: true,

    // Enviar apenas leads com telefone
    requirePhone: false,

    // Filtrar por status (deixe vazio [] para enviar todos)
    // Exemplos: ['novo', 'qualificado', 'fechado']
    statusFilter: [], // Vazio = envia todos os status

    // Filtrar por origem (deixe vazio [] para enviar todas)
    // Exemplos: ['landing_page_modal', 'micro_landing_page']
    origemFilter: [],

    // Idade máxima do lead em horas (null = sem limite)
    // Exemplo: 24 = apenas leads das últimas 24h
    maxAgeHours: null,

    // Limite de leads por execução (evita sobrecarga)
    limit: 100
  },

  // Modo de operação
  mode: {
    dryRun: false, // true = apenas simula, não envia para Meta
    verbose: true  // true = mostra logs detalhados
  }
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Hash SHA256 para dados sensíveis (Meta exige)
 */
function hashSHA256(text) {
  if (!text) return null;
  return crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

/**
 * Normaliza telefone brasileiro para formato internacional
 */
function normalizePhone(phone) {
  if (!phone) return null;

  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '');

  // Se começa com 0, remove
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Se não tem código do país, adiciona +55
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }

  return cleaned;
}

/**
 * Log condicional baseado em verbose
 */
function log(...args) {
  if (CONFIG.mode.verbose) {
    console.log('[GTX]', ...args);
  }
}

// ============================================
// BUSCAR LEADS NO SUPABASE
// ============================================

async function fetchLeadsFromSupabase() {
  log('🔍 Buscando leads no Supabase...');

  let query = `${CONFIG.supabaseUrl}/rest/v1/leads?select=*`;

  // Filtro: apenas não enviados
  if (CONFIG.filters.onlyNotSent) {
    query += '&enviado_meta_lead=eq.false';
  }

  // Filtro: requer email
  if (CONFIG.filters.requireEmail) {
    query += '&email=not.is.null';
  }

  // Filtro: requer telefone
  if (CONFIG.filters.requirePhone) {
    query += '&telefone=not.is.null';
  }

  // Filtro: por status
  if (CONFIG.filters.statusFilter.length > 0) {
    query += '&status=in.(${CONFIG.filters.statusFilter.join(',')})';
  }

  // Filtro: por origem
  if (CONFIG.filters.origemFilter.length > 0) {
    query += '&origem=in.(${CONFIG.filters.origemFilter.join(',')})';
  }

  // Filtro: idade máxima
  if (CONFIG.filters.maxAgeHours) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - CONFIG.filters.maxAgeHours);
    query += `&created_at=gte.${cutoffDate.toISOString()}`;
  }

  // Ordenar por mais recentes e limitar
  query += `&order=created_at.desc&limit=${CONFIG.filters.limit}`;

  log('📝 Query:', query);

  const response = await fetch(query, {
    headers: {
      'apikey': CONFIG.supabaseKey,
      'Authorization': `Bearer ${CONFIG.supabaseKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar leads: ${response.statusText}`);
  }

  const leads = await response.json();
  log(`✅ Encontrados ${leads.length} leads para processar`);

  return leads;
}

// ============================================
// ENVIAR LEAD PARA META CAPI
// ============================================

async function sendLeadToMetaCAPI(lead) {
  const eventTime = Math.floor(new Date(lead.created_at).getTime() / 1000);

  // Preparar user_data (quanto mais dados, melhor o Event Match Quality)
  const userData = {
    em: lead.email ? [hashSHA256(lead.email)] : undefined,
    ph: lead.telefone ? [hashSHA256(normalizePhone(lead.telefone))] : undefined,
    fn: lead.nome ? [hashSHA256(lead.nome.split(' ')[0])] : undefined, // primeiro nome
    ln: lead.nome ? [hashSHA256(lead.nome.split(' ').slice(-1)[0])] : undefined, // último nome
    client_ip_address: lead.ip_address || undefined,
    client_user_agent: lead.user_agent || undefined,
    fbp: lead.fbp || undefined,
    fbc: lead.fbc || undefined
  };

  // Remover campos undefined
  Object.keys(userData).forEach(key => {
    if (userData[key] === undefined) {
      delete userData[key];
    }
  });

  // Preparar payload
  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: eventTime,
      event_id: lead.event_id || `evt_${lead.id}`,
      event_source_url: lead.url_origem || 'https://www.agenciagtx.com.br',
      action_source: 'website',
      user_data: userData,
      custom_data: {
        content_name: lead.origem || 'Landing Page',
        value: lead.valor_venda || 0,
        currency: 'BRL'
      }
    }]
  };

  if (CONFIG.mode.dryRun) {
    log('🔵 [DRY RUN] Payload que seria enviado:', JSON.stringify(payload, null, 2));
    return { success: true, dryRun: true };
  }

  // Enviar para Meta CAPI
  const capiUrl = `https://graph.facebook.com/v21.0/${CONFIG.pixelId}/events?access_token=${CONFIG.accessToken}`;

  const response = await fetch(capiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ Erro ao enviar para Meta:', result);
    return { success: false, error: result };
  }

  log('✅ Lead enviado para Meta:', lead.id);
  return { success: true, result };
}

// ============================================
// MARCAR LEAD COMO ENVIADO
// ============================================

async function markLeadAsSent(leadId) {
  const url = `${CONFIG.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': CONFIG.supabaseKey,
      'Authorization': `Bearer ${CONFIG.supabaseKey}`
    },
    body: JSON.stringify({
      enviado_meta_lead: true,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    console.error(`❌ Erro ao marcar lead ${leadId} como enviado`);
  }
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log('🚀 GTX - Sync Leads to Meta CAPI');
  console.log('==================================\n');

  // Validar configurações
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
    console.error('❌ Erro: Credenciais Supabase não configuradas');
    process.exit(1);
  }

  if (!CONFIG.pixelId || !CONFIG.accessToken) {
    console.error('❌ Erro: Credenciais Meta não configuradas');
    process.exit(1);
  }

  if (CONFIG.mode.dryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhum dado será enviado para Meta\n');
  }

  try {
    // 1. Buscar leads
    const leads = await fetchLeadsFromSupabase();

    if (leads.length === 0) {
      log('ℹ️  Nenhum lead para processar');
      return;
    }

    // 2. Processar cada lead
    let successCount = 0;
    let errorCount = 0;

    for (const lead of leads) {
      log(`\n📤 Processando lead: ${lead.id} - ${lead.nome} (${lead.email})`);

      try {
        // Enviar para Meta
        const result = await sendLeadToMetaCAPI(lead);

        if (result.success) {
          successCount++;

          // Marcar como enviado (se não for dry run)
          if (!CONFIG.mode.dryRun) {
            await markLeadAsSent(lead.id);
          }
        } else {
          errorCount++;
        }

        // Aguardar 500ms entre requisições (evitar rate limit)
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Erro ao processar lead ${lead.id}:`, error.message);
        errorCount++;
      }
    }

    // 3. Resumo
    console.log('\n==================================');
    console.log('📊 RESUMO DA EXECUÇÃO');
    console.log('==================================');
    console.log(`✅ Enviados com sucesso: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📝 Total processado: ${leads.length}`);

    if (CONFIG.mode.dryRun) {
      console.log('\n⚠️  Lembre-se: Este foi um DRY RUN. Nenhum dado foi enviado.');
      console.log('Para enviar de verdade, mude mode.dryRun para false\n');
    }

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    process.exit(1);
  }
}

// ============================================
// EXECUTAR
// ============================================

main();
