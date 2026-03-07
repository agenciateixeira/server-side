/**
 * GTX - Meta Conversions API (CAPI)
 * Script para enviar eventos de conversão para o Meta
 */

require('dotenv').config({ path: '../config/.env' });
const crypto = require('crypto');

// ============================================
// CONFIGURAÇÕES
// ============================================
const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const API_VERSION = 'v18.0';

/**
 * Hasheia um valor com SHA256 (requerido pela CAPI)
 */
function hashSHA256(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Envia um evento para Meta Conversions API
 *
 * @param {Object} params - Parâmetros do evento
 * @param {string} params.event_name - Nome do evento (Lead, Purchase, etc)
 * @param {string} params.event_id - ID único para deduplicação
 * @param {string} params.fbp - Cookie _fbp
 * @param {string} params.fbc - Cookie _fbc (opcional)
 * @param {string} params.email - Email do usuário
 * @param {string} params.phone - Telefone do usuário
 * @param {string} params.ip_address - IP do usuário
 * @param {string} params.user_agent - User agent
 * @param {string} params.event_source_url - URL da página
 * @param {number} params.value - Valor da conversão (para Purchase)
 * @param {string} params.currency - Moeda (default: BRL)
 * @param {string} params.test_event_code - Código de teste (opcional)
 */
async function sendEventToCAPI(params) {
  const {
    event_name,
    event_id,
    fbp,
    fbc,
    email,
    phone,
    ip_address,
    user_agent,
    event_source_url,
    value,
    currency = 'BRL',
    test_event_code
  } = params;

  // Validação básica
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    throw new Error('META_PIXEL_ID e META_ACCESS_TOKEN são obrigatórios no .env');
  }

  if (!event_name || !event_id) {
    throw new Error('event_name e event_id são obrigatórios');
  }

  // Monta o payload
  const payload = {
    data: [
      {
        event_name: event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event_id,
        event_source_url: event_source_url || undefined,
        action_source: 'website',

        user_data: {
          // Dados hasheados
          em: email ? [hashSHA256(email)] : undefined,
          ph: phone ? [hashSHA256(phone)] : undefined,

          // Cookies (não hashear!)
          fbp: fbp || undefined,
          fbc: fbc || undefined,

          // Dados técnicos
          client_ip_address: ip_address || undefined,
          client_user_agent: user_agent || undefined
        },

        // Dados customizados (apenas para eventos de conversão)
        custom_data: value ? {
          value: parseFloat(value),
          currency: currency
        } : undefined
      }
    ],

    // Test Event Code (se fornecido)
    test_event_code: test_event_code || undefined
  };

  // Remove campos undefined
  cleanUndefined(payload);

  // Envia para CAPI
  const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error) {
      console.error('❌ Erro ao enviar evento CAPI:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Evento CAPI enviado com sucesso:', event_name);
    console.log('   Events received:', result.events_received);
    console.log('   FBTRACE ID:', result.fbtrace_id);
    console.log('   Event ID:', event_id);

    return { success: true, data: result };

  } catch (error) {
    console.error('❌ Erro de rede ao enviar CAPI:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Remove campos undefined do objeto (recursivo)
 */
function cleanUndefined(obj) {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      cleanUndefined(obj[key]);
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key];
      }
    }
  });
}

// Exporta a função
module.exports = { sendEventToCAPI, hashSHA256 };

// Se executado diretamente, roda um teste
if (require.main === module) {
  console.log('🧪 Modo de teste - Enviando evento de exemplo...\n');

  sendEventToCAPI({
    event_name: 'Lead',
    event_id: 'test_' + Date.now(),
    email: 'teste@gtx.com.br',
    phone: '11999999999',
    fbp: 'fb.1.1234567890.987654321',
    event_source_url: 'https://gtx.com.br',
    test_event_code: 'TEST12345' // Remova em produção
  }).then(result => {
    if (result.success) {
      console.log('\n✅ Teste concluído com sucesso!');
      console.log('Verifique no Meta Events Manager → Test Events');
    } else {
      console.log('\n❌ Teste falhou');
    }
  });
}
