/**
 * GTX - Backfill Geolocalização
 *
 * Este script busca leads que TÊM IP mas NÃO têm geolocalização
 * e preenche cidade/estado/país baseado no IP.
 *
 * Executar: node scripts/backfill-geolocation.js
 */

require('dotenv').config({ path: './config/.env' });

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG = {
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Processamento
  batchSize: 10,      // Processar 10 leads por vez
  delayBetweenBatches: 2000, // 2 segundos entre lotes (evita rate limit)
  delayBetweenRequests: 150,  // 150ms entre requests (45 req/min = 1 a cada 1.3s)

  // Modo de operação
  mode: {
    dryRun: false,  // true = apenas simula, false = atualiza de verdade
    verbose: true   // true = mostra logs detalhados
  }
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Log condicional
 */
function log(...args) {
  if (CONFIG.mode.verbose) {
    console.log('[GTX Backfill]', ...args);
  }
}

/**
 * Busca geolocalização baseada no IP
 */
async function getGeolocation(ip) {
  if (!ip) return null;

  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,countryCode,region`
    );
    const data = await response.json();

    if (data.status === 'success') {
      return {
        pais: data.country || null,
        pais_codigo: data.countryCode || null,
        estado: data.regionName || null,
        estado_codigo: data.region || null,
        cidade: data.city || null
      };
    }

    return null;

  } catch (error) {
    console.error('❌ Erro ao buscar geolocalização para IP', ip, ':', error.message);
    return null;
  }
}

/**
 * Aguarda X milissegundos
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// BUSCAR LEADS SEM GEOLOCALIZAÇÃO
// ============================================

async function fetchLeadsWithoutGeo() {
  log('🔍 Buscando leads sem geolocalização...');

  // Busca leads que TÊM IP mas NÃO têm geolocalização
  const query = `${CONFIG.supabaseUrl}/rest/v1/leads?select=*&ip_address=not.is.null&cidade=is.null&order=created_at.desc`;

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
  log(`✅ Encontrados ${leads.length} leads sem geolocalização`);

  return leads;
}

// ============================================
// ATUALIZAR GEOLOCALIZAÇÃO NO SUPABASE
// ============================================

async function updateLeadGeolocation(leadId, geoData) {
  const url = `${CONFIG.supabaseUrl}/rest/v1/leads?id=eq.${leadId}`;

  if (CONFIG.mode.dryRun) {
    log(`🔵 [DRY RUN] Atualizaria lead ${leadId}:`, geoData);
    return { success: true, dryRun: true };
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': CONFIG.supabaseKey,
      'Authorization': `Bearer ${CONFIG.supabaseKey}`
    },
    body: JSON.stringify({
      pais: geoData.pais,
      pais_codigo: geoData.pais_codigo,
      estado: geoData.estado,
      estado_codigo: geoData.estado_codigo,
      cidade: geoData.cidade,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    console.error(`❌ Erro ao atualizar lead ${leadId}`);
    return { success: false };
  }

  return { success: true };
}

// ============================================
// PROCESSAR LOTES
// ============================================

async function processBatch(leads, batchNumber) {
  log(`\n📦 Processando lote ${batchNumber} (${leads.length} leads)...`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const lead of leads) {
    try {
      log(`\n📍 Lead: ${lead.id} | IP: ${lead.ip_address}`);

      // Buscar geolocalização
      const geoData = await getGeolocation(lead.ip_address);

      if (!geoData) {
        log('⚠️  Geolocalização não encontrada');
        skippedCount++;
        continue;
      }

      log(`✅ Encontrado: ${geoData.cidade}, ${geoData.estado}, ${geoData.pais}`);

      // Atualizar no Supabase
      const result = await updateLeadGeolocation(lead.id, geoData);

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }

      // Aguardar entre requests (rate limit)
      await sleep(CONFIG.delayBetweenRequests);

    } catch (error) {
      console.error(`❌ Erro ao processar lead ${lead.id}:`, error.message);
      errorCount++;
    }
  }

  log(`\n📊 Lote ${batchNumber} concluído:`);
  log(`   ✅ Sucesso: ${successCount}`);
  log(`   ❌ Erros: ${errorCount}`);
  log(`   ⏭️  Ignorados: ${skippedCount}`);

  return { successCount, errorCount, skippedCount };
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log('🌍 GTX - Backfill de Geolocalização');
  console.log('=====================================\n');

  // Validar configurações
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
    console.error('❌ Erro: Credenciais Supabase não configuradas');
    process.exit(1);
  }

  if (CONFIG.mode.dryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhum dado será atualizado\n');
  }

  try {
    // 1. Buscar leads
    const leads = await fetchLeadsWithoutGeo();

    if (leads.length === 0) {
      log('ℹ️  Nenhum lead para processar');
      return;
    }

    // 2. Dividir em lotes
    const batches = [];
    for (let i = 0; i < leads.length; i += CONFIG.batchSize) {
      batches.push(leads.slice(i, i + CONFIG.batchSize));
    }

    log(`📦 Total de lotes: ${batches.length}`);

    // 3. Processar cada lote
    let totalSuccess = 0;
    let totalErrors = 0;
    let totalSkipped = 0;

    for (let i = 0; i < batches.length; i++) {
      const result = await processBatch(batches[i], i + 1);

      totalSuccess += result.successCount;
      totalErrors += result.errorCount;
      totalSkipped += result.skippedCount;

      // Aguardar entre lotes (evitar rate limit)
      if (i < batches.length - 1) {
        log(`\n⏳ Aguardando ${CONFIG.delayBetweenBatches}ms antes do próximo lote...\n`);
        await sleep(CONFIG.delayBetweenBatches);
      }
    }

    // 4. Resumo final
    console.log('\n=====================================');
    console.log('📊 RESUMO FINAL');
    console.log('=====================================');
    console.log(`✅ Atualizados com sucesso: ${totalSuccess}`);
    console.log(`❌ Erros: ${totalErrors}`);
    console.log(`⏭️  Ignorados (sem geo): ${totalSkipped}`);
    console.log(`📝 Total processado: ${leads.length}`);

    if (CONFIG.mode.dryRun) {
      console.log('\n⚠️  Este foi um DRY RUN. Nenhum dado foi atualizado.');
      console.log('Para atualizar de verdade, mude mode.dryRun para false\n');
    } else {
      console.log('\n✅ Backfill concluído com sucesso!\n');
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
