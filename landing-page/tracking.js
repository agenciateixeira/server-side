/**
 * GTX - Script de Tracking para Landing Page
 * Captura dados e salva no Supabase antes de redirecionar para WhatsApp
 *
 * COMO USAR:
 * 1. Adicione este script antes do fechamento do </body>
 * 2. Configure SUPABASE_URL e SUPABASE_ANON_KEY
 * 3. Adicione class="whatsapp-button" nos links de WhatsApp
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURAÇÕES - ALTERE AQUI
  // ============================================
  const CONFIG = {
    SUPABASE_URL: 'https://cffpqwynoftzqpdkaqoj.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZnBxd3lub2Z0enFwZGthcW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDQxNzIsImV4cCI6MjA4ODM4MDE3Mn0.K1FtTA4akissZGMIz1tbZ6fB8_QQOxymO52gSfPO6yA',
    DEBUG: true // Ative para ver logs no console
  };

  /**
   * Extrai um cookie específico
   */
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  /**
   * Extrai parâmetros da URL
   */
  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      gclid: params.get('gclid'),
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term')
    };
  }

  /**
   * Busca IP do usuário via API externa
   */
  async function getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      if (CONFIG.DEBUG) console.error('Erro ao buscar IP:', error);
      return null;
    }
  }

  /**
   * Gera ID único para evento
   */
  function generateEventID() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Captura todos os dados de tracking
   */
  async function captureTrackingData() {
    const urlParams = getUrlParams();
    const userIP = await getUserIP();

    return {
      // Cookies Meta
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc'),

      // Google Click ID
      gclid: urlParams.gclid,

      // Event ID único (para deduplicação)
      event_id: generateEventID(),

      // UTMs
      utm_source: urlParams.utm_source,
      utm_medium: urlParams.utm_medium,
      utm_campaign: urlParams.utm_campaign,
      utm_content: urlParams.utm_content,
      utm_term: urlParams.utm_term,

      // Dados técnicos
      user_agent: navigator.userAgent,
      ip_address: userIP,
      url_origem: window.location.href,

      // Status inicial
      status: 'novo'
    };
  }

  /**
   * Captura dados de formulário (se existir)
   */
  function getFormData() {
    return {
      nome: document.getElementById('nome')?.value ||
            document.querySelector('[name="nome"]')?.value ||
            document.querySelector('[name="name"]')?.value || null,

      email: document.getElementById('email')?.value ||
             document.querySelector('[name="email"]')?.value ||
             document.querySelector('[type="email"]')?.value || null,

      telefone: document.getElementById('telefone')?.value ||
                document.getElementById('phone')?.value ||
                document.querySelector('[name="telefone"]')?.value ||
                document.querySelector('[name="phone"]')?.value ||
                document.querySelector('[type="tel"]')?.value || null
    };
  }

  /**
   * Salva lead no Supabase
   */
  async function saveLeadToSupabase(data) {
    try {
      const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (CONFIG.DEBUG) {
        console.log('✅ GTX: Lead salvo com sucesso', result);
      }

      return result[0];

    } catch (error) {
      console.error('❌ GTX: Erro ao salvar lead:', error);
      return null;
    }
  }

  /**
   * Envia evento para Meta Pixel (client-side)
   */
  function sendPixelEvent(eventName, eventID) {
    if (typeof fbq !== 'undefined') {
      fbq('track', eventName, {}, { eventID: eventID });
      if (CONFIG.DEBUG) {
        console.log('✅ GTX: Evento Pixel enviado:', eventName, eventID);
      }
    }
  }

  /**
   * Handler do botão WhatsApp
   */
  async function handleWhatsAppClick(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const whatsappURL = button.href;
    const originalText = button.textContent;

    // Mostra loading
    button.textContent = 'Aguarde...';
    button.style.opacity = '0.7';
    button.style.pointerEvents = 'none';

    try {
      // 1. Captura dados de tracking
      const trackingData = await captureTrackingData();

      // 2. Captura dados de formulário (se existir)
      const formData = getFormData();

      // 3. Merge dos dados
      const leadData = { ...trackingData, ...formData };

      if (CONFIG.DEBUG) {
        console.log('📊 GTX: Dados capturados:', leadData);
      }

      // 4. Salva no Supabase
      await saveLeadToSupabase(leadData);

      // 5. Envia evento para Pixel (client-side)
      sendPixelEvent('Lead', leadData.event_id);

      // 6. Pequeno delay para garantir que salvou
      await new Promise(resolve => setTimeout(resolve, 500));

      // 7. Redireciona para WhatsApp
      window.location.href = whatsappURL;

    } catch (error) {
      console.error('❌ GTX: Erro no tracking:', error);

      // Redireciona mesmo com erro (não bloqueia usuário)
      setTimeout(() => {
        window.location.href = whatsappURL;
      }, 500);
    }
  }

  /**
   * Inicialização
   */
  function init() {
    // Aguarda DOM carregar
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Seleciona todos os botões WhatsApp
    const selectors = [
      'a[href*="wa.me"]',
      'a[href*="api.whatsapp.com"]',
      '.whatsapp-button',
      '[data-whatsapp]'
    ];

    const buttons = document.querySelectorAll(selectors.join(', '));

    if (buttons.length === 0) {
      console.warn('⚠️ GTX: Nenhum botão WhatsApp encontrado');
      return;
    }

    // Adiciona listener em todos os botões
    buttons.forEach(button => {
      button.addEventListener('click', handleWhatsAppClick);
    });

    if (CONFIG.DEBUG) {
      console.log(`✅ GTX Tracking ativo em ${buttons.length} botão(ões) WhatsApp`);
    }
  }

  // Auto-inicializa
  init();

})();
