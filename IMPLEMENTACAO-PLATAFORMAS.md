# 🚀 GTX Server-Side Tracking - Implementação em Diferentes Plataformas

Este guia mostra como implementar o **GTX Server-Side Tracking** em diferentes plataformas: Shopify, WordPress, e outras.

---

## 📋 Índice

1. [Shopify - E-commerce](#shopify---e-commerce)
2. [WordPress - Landing Pages](#wordpress---landing-pages)
3. [HTML Puro - Sites Estáticos](#html-puro---sites-estáticos)
4. [Outras Plataformas](#outras-plataformas)

---

## 🛍️ Shopify - E-commerce

### Pré-requisitos

- Loja Shopify (qualquer plano)
- Acesso ao painel administrativo
- Supabase configurado (tabelas `leads` e `sessions`)
- Meta Pixel ID e Google Ads configurados

### Passo 1: Configurar Scripts no Theme

**1.1. Acesse o Editor de Código do Tema:**

```
Admin Shopify → Online Store → Themes → Actions → Edit Code
```

**1.2. Adicione o código de Session Tracking:**

Crie um novo snippet: `Snippets → Add a new snippet` → Nome: `gtx-session-tracking`

```liquid
<!-- GTX Session Tracking -->
<script>
(function() {
  const SUPABASE_URL = '{{ settings.gtx_supabase_url }}';
  const SUPABASE_ANON_KEY = '{{ settings.gtx_supabase_anon_key }}';

  // Função para obter ou criar GTX User ID
  function getGTXUserID() {
    const cookieName = '_gtx_uid';
    const match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));

    if (match) return match[2];

    const newID = 'gtx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const expires = new Date();
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = cookieName + '=' + newID + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax';

    return newID;
  }

  // Função para obter Session ID
  function getSessionID() {
    const storageKey = '_gtx_session_id';
    let sessionID = sessionStorage.getItem(storageKey);

    if (!sessionID) {
      sessionID = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(storageKey, sessionID);
    }

    return sessionID;
  }

  // Função para capturar cookies
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  // Função para capturar UTMs
  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      gclid: params.get('gclid'),
      fbclid: params.get('fbclid'),
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term')
    };
  }

  // Detectar tipo de dispositivo
  function getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad)/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)/.test(ua)) return 'mobile';
    return 'desktop';
  }

  // Detectar navegador
  function getBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('chrome') > -1 && ua.indexOf('edg') === -1) return 'chrome';
    if (ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1) return 'safari';
    if (ua.indexOf('firefox') > -1) return 'firefox';
    if (ua.indexOf('edg') > -1) return 'edge';
    return 'other';
  }

  // Detectar SO
  function getOS() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('win') > -1) return 'windows';
    if (ua.indexOf('mac') > -1) return 'mac';
    if (ua.indexOf('linux') > -1) return 'linux';
    if (ua.indexOf('android') > -1) return 'android';
    if (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1) return 'ios';
    return 'other';
  }

  // Registrar sessão no Supabase
  async function trackSession() {
    try {
      const urlParams = getUrlParams();

      const sessionData = {
        gtx_uid: getGTXUserID(),
        session_id: getSessionID(),
        landing_page: window.location.pathname,
        referrer: document.referrer || 'direct',
        utm_source: urlParams.utm_source,
        utm_medium: urlParams.utm_medium,
        utm_campaign: urlParams.utm_campaign,
        utm_content: urlParams.utm_content,
        utm_term: urlParams.utm_term,
        gclid: urlParams.gclid,
        fbclid: urlParams.fbclid,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        pages_viewed: 1,
        converted: false
      };

      const response = await fetch(SUPABASE_URL + '/rest/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(sessionData)
      });

      console.log('[GTX] Sessão registrada');
    } catch (error) {
      console.error('[GTX] Erro ao registrar sessão:', error);
    }
  }

  // Executar quando página carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackSession);
  } else {
    trackSession();
  }
})();
</script>
```

**1.3. Incluir o snippet no tema:**

Edite `theme.liquid` e adicione antes de `</head>`:

```liquid
{% render 'gtx-session-tracking' %}
```

---

### Passo 2: Tracking de Conversões (Checkout)

**2.1. Adicionar script no Checkout (Shopify Plus ou usando Apps):**

Se você tem Shopify Plus, vá em:
```
Settings → Checkout → Order Status Page → Additional Scripts
```

Adicione:

```html
<script>
(function() {
  // Dados do pedido Shopify
  const orderData = {
    order_id: '{{ order.id }}',
    order_number: '{{ order.order_number }}',
    total_price: {{ total_price | money_without_currency }},
    email: '{{ email }}',
    phone: '{{ phone }}',
    customer_name: '{{ customer.name }}'
  };

  // Função para capturar GTX User ID
  function getGTXUserID() {
    const match = document.cookie.match(new RegExp('(^| )_gtx_uid=([^;]+)'));
    return match ? match[2] : null;
  }

  // Função para capturar Session ID
  function getSessionID() {
    return sessionStorage.getItem('_gtx_session_id');
  }

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  // Gerar Event ID único
  function generateEventID() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Salvar conversão no Supabase
  async function trackPurchase() {
    const eventID = generateEventID();

    const leadData = {
      gtx_uid: getGTXUserID(),
      event_id: eventID,
      nome: orderData.customer_name,
      email: orderData.email,
      telefone: orderData.phone,
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc'),
      gclid: new URLSearchParams(window.location.search).get('gclid'),
      user_agent: navigator.userAgent,
      url_origem: window.location.href,
      origem: 'shopify_checkout',
      status: 'fechado',
      valor_venda: orderData.total_price,
      mensagem: 'Pedido #' + orderData.order_number
    };

    const SUPABASE_URL = '{{ settings.gtx_supabase_url }}';
    const SUPABASE_ANON_KEY = '{{ settings.gtx_supabase_anon_key }}';

    // Salvar no Supabase
    try {
      const response = await fetch(SUPABASE_URL + '/rest/v1/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(leadData)
      });

      const data = await response.json();

      // Marcar sessão como convertida
      const sessionID = getSessionID();
      if (sessionID && data[0]?.id) {
        await fetch(SUPABASE_URL + '/rest/v1/sessions?session_id=eq.' + sessionID, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            converted: true,
            lead_id: data[0].id
          })
        });
      }

      // Enviar evento Purchase para Meta Pixel
      if (window.fbq) {
        fbq('track', 'Purchase', {
          value: orderData.total_price,
          currency: 'BRL',
          content_type: 'product'
        }, { eventID: eventID });
      }

      // Enviar para Google Ads
      if (window.gtag) {
        gtag('event', 'conversion', {
          'send_to': 'AW-XXXXXXXXX/CONVERSION_LABEL',
          'value': orderData.total_price,
          'currency': 'BRL',
          'transaction_id': orderData.order_id
        });
      }

      console.log('[GTX] Purchase registrado:', eventID);
    } catch (error) {
      console.error('[GTX] Erro ao registrar purchase:', error);
    }
  }

  // Executar tracking
  trackPurchase();
})();
</script>
```

---

### Passo 3: Configurar Settings do Tema

**3.1. Edite `config/settings_schema.json` e adicione:**

```json
{
  "name": "GTX Tracking",
  "settings": [
    {
      "type": "text",
      "id": "gtx_supabase_url",
      "label": "Supabase URL",
      "info": "URL do seu projeto Supabase (ex: https://xxx.supabase.co)"
    },
    {
      "type": "text",
      "id": "gtx_supabase_anon_key",
      "label": "Supabase Anon Key",
      "info": "Chave pública do Supabase"
    }
  ]
}
```

**3.2. Configure as credenciais:**

```
Admin → Online Store → Themes → Customize → Theme Settings → GTX Tracking
```

Preencha:
- **Supabase URL:** `https://cffpqwynoftzqpdkaqoj.supabase.co`
- **Supabase Anon Key:** `eyJhbGci...`

---

## 📄 WordPress - Landing Pages

### Método 1: Plugin Functions.php + Scripts

**Passo 1: Criar arquivo de tracking**

Crie um arquivo `gtx-tracking.js` e faça upload em:
```
wp-content/themes/seu-tema/js/gtx-tracking.js
```

```javascript
// GTX Session Tracking para WordPress
(function() {
  const SUPABASE_URL = gtxConfig.supabaseUrl;
  const SUPABASE_ANON_KEY = gtxConfig.supabaseAnonKey;

  // [COPIE AQUI O CÓDIGO DE SESSION TRACKING DO SHOPIFY]
  // (mesmo código das funções getGTXUserID, getSessionID, trackSession, etc)

})();
```

**Passo 2: Enfileirar script no functions.php**

Edite `wp-content/themes/seu-tema/functions.php`:

```php
<?php
// GTX Server-Side Tracking
function gtx_enqueue_tracking_scripts() {
    // Enfileirar script
    wp_enqueue_script(
        'gtx-tracking',
        get_template_directory_uri() . '/js/gtx-tracking.js',
        array(),
        '1.0.0',
        true
    );

    // Passar configurações para JavaScript
    wp_localize_script('gtx-tracking', 'gtxConfig', array(
        'supabaseUrl' => get_option('gtx_supabase_url'),
        'supabaseAnonKey' => get_option('gtx_supabase_anon_key')
    ));
}
add_action('wp_enqueue_scripts', 'gtx_enqueue_tracking_scripts');

// Adicionar campos de configuração no admin
function gtx_register_settings() {
    register_setting('general', 'gtx_supabase_url');
    register_setting('general', 'gtx_supabase_anon_key');

    add_settings_section(
        'gtx_settings_section',
        'GTX Tracking Settings',
        null,
        'general'
    );

    add_settings_field(
        'gtx_supabase_url',
        'Supabase URL',
        'gtx_supabase_url_callback',
        'general',
        'gtx_settings_section'
    );

    add_settings_field(
        'gtx_supabase_anon_key',
        'Supabase Anon Key',
        'gtx_supabase_anon_key_callback',
        'general',
        'gtx_settings_section'
    );
}
add_action('admin_init', 'gtx_register_settings');

function gtx_supabase_url_callback() {
    $value = get_option('gtx_supabase_url');
    echo '<input type="text" name="gtx_supabase_url" value="' . esc_attr($value) . '" class="regular-text" />';
}

function gtx_supabase_anon_key_callback() {
    $value = get_option('gtx_supabase_anon_key');
    echo '<input type="text" name="gtx_supabase_anon_key" value="' . esc_attr($value) . '" class="regular-text" />';
}
?>
```

**Passo 3: Configurar credenciais**

```
WordPress Admin → Settings → General → GTX Tracking Settings
```

Preencha:
- **Supabase URL**
- **Supabase Anon Key**

---

### Método 2: Elementor + Custom HTML

**Passo 1: Adicionar Session Tracking no Header**

```
Elementor → Settings → Custom Code → Header
```

Adicione:

```html
<script>
// Configuração
const GTX_SUPABASE_URL = 'https://cffpqwynoftzqpdkaqoj.supabase.co';
const GTX_SUPABASE_ANON_KEY = 'eyJhbGci...';

// [COLE AQUI O CÓDIGO COMPLETO DE SESSION TRACKING]
</script>
```

**Passo 2: Adicionar tracking de conversão no formulário**

No formulário Elementor, adicione um **HTML Widget** após o botão:

```html
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Capturar envio do formulário Elementor
  jQuery(document).on('submit_success', function(event, response) {

    // Capturar dados do formulário
    const formData = {
      nome: jQuery('[name="form_fields[name]"]').val(),
      email: jQuery('[name="form_fields[email]"]').val(),
      telefone: jQuery('[name="form_fields[phone]"]').val(),
      mensagem: jQuery('[name="form_fields[message]"]').val()
    };

    // Função para capturar tracking data
    async function trackElementorLead() {
      const eventID = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
      }

      function getGTXUserID() {
        return getCookie('_gtx_uid');
      }

      function getSessionID() {
        return sessionStorage.getItem('_gtx_session_id');
      }

      const urlParams = new URLSearchParams(window.location.search);

      const leadData = {
        gtx_uid: getGTXUserID(),
        event_id: eventID,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        mensagem: formData.mensagem,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
        gclid: urlParams.get('gclid'),
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        user_agent: navigator.userAgent,
        url_origem: window.location.href,
        origem: 'elementor_form',
        status: 'novo'
      };

      try {
        // Salvar no Supabase
        const response = await fetch(GTX_SUPABASE_URL + '/rest/v1/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': GTX_SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + GTX_SUPABASE_ANON_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(leadData)
        });

        const data = await response.json();

        // Marcar sessão como convertida
        const sessionID = getSessionID();
        if (sessionID && data[0]?.id) {
          await fetch(GTX_SUPABASE_URL + '/rest/v1/sessions?session_id=eq.' + sessionID, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': GTX_SUPABASE_ANON_KEY,
              'Authorization': 'Bearer ' + GTX_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              converted: true,
              lead_id: data[0].id
            })
          });
        }

        // Enviar para Meta Pixel
        if (window.fbq) {
          fbq('track', 'Lead', {
            content_name: 'Formulário Elementor'
          }, { eventID: eventID });
        }

        // Enviar para Google Ads
        if (window.gtag) {
          gtag('event', 'conversion', {
            'send_to': 'AW-XXXXXXXXX/CONVERSION_LABEL'
          });
        }

        console.log('[GTX] Lead registrado:', eventID);
      } catch (error) {
        console.error('[GTX] Erro:', error);
      }
    }

    // Executar tracking
    trackElementorLead();
  });
});
</script>
```

---

### Método 3: Contact Form 7 + Hook

Adicione no `functions.php`:

```php
<?php
// GTX Tracking - Contact Form 7
add_action('wpcf7_mail_sent', 'gtx_track_cf7_submission');

function gtx_track_cf7_submission($contact_form) {
    $submission = WPCF7_Submission::get_instance();

    if ($submission) {
        $posted_data = $submission->get_posted_data();

        // Preparar dados
        $lead_data = array(
            'nome' => isset($posted_data['your-name']) ? $posted_data['your-name'] : '',
            'email' => isset($posted_data['your-email']) ? $posted_data['your-email'] : '',
            'telefone' => isset($posted_data['your-phone']) ? $posted_data['your-phone'] : '',
            'mensagem' => isset($posted_data['your-message']) ? $posted_data['your-message'] : '',
            'origem' => 'contact_form_7'
        );

        // Enviar para Supabase via AJAX
        ?>
        <script>
        (async function() {
            const leadData = <?php echo json_encode($lead_data); ?>;

            // [ADICIONE AQUI O CÓDIGO DE TRACKING COMPLETO]

        })();
        </script>
        <?php
    }
}
?>
```

---

## 🌐 HTML Puro - Sites Estáticos

**index.html:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Landing Page</title>

    <!-- GTX Session Tracking -->
    <script src="gtx-tracking.js"></script>
</head>
<body>
    <h1>Landing Page</h1>

    <form id="leadForm">
        <input type="text" name="nome" placeholder="Nome" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="tel" name="telefone" placeholder="Telefone" required>
        <textarea name="mensagem" placeholder="Mensagem"></textarea>
        <button type="submit">Enviar</button>
    </form>

    <script>
    // Configuração
    const SUPABASE_URL = 'https://cffpqwynoftzqpdkaqoj.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGci...';

    // Capturar envio do formulário
    document.getElementById('leadForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const eventID = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        function getCookie(name) {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? match[2] : null;
        }

        function getGTXUserID() {
            return getCookie('_gtx_uid');
        }

        function getSessionID() {
            return sessionStorage.getItem('_gtx_session_id');
        }

        const urlParams = new URLSearchParams(window.location.search);

        const leadData = {
            gtx_uid: getGTXUserID(),
            event_id: eventID,
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            mensagem: formData.get('mensagem'),
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc'),
            gclid: urlParams.get('gclid'),
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            user_agent: navigator.userAgent,
            url_origem: window.location.href,
            origem: 'html_form',
            status: 'novo'
        };

        try {
            // Salvar no Supabase
            const response = await fetch(SUPABASE_URL + '/rest/v1/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(leadData)
            });

            const data = await response.json();

            // Marcar sessão
            const sessionID = getSessionID();
            if (sessionID && data[0]?.id) {
                await fetch(SUPABASE_URL + '/rest/v1/sessions?session_id=eq.' + sessionID, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({
                        converted: true,
                        lead_id: data[0].id
                    })
                });
            }

            // Meta Pixel
            if (window.fbq) {
                fbq('track', 'Lead', {}, { eventID: eventID });
            }

            // Google Ads
            if (window.gtag) {
                gtag('event', 'conversion', {
                    'send_to': 'AW-XXXXXXXXX/CONVERSION_LABEL'
                });
            }

            alert('Dados enviados com sucesso!');
            e.target.reset();

        } catch (error) {
            console.error('[GTX] Erro:', error);
            alert('Erro ao enviar. Tente novamente.');
        }
    });
    </script>
</body>
</html>
```

**gtx-tracking.js:**

```javascript
// [COLE AQUI TODO O CÓDIGO DE SESSION TRACKING DO SHOPIFY]
```

---

## 🔧 Outras Plataformas

### Wix

1. **Adicionar código no Header:**
   - Settings → Custom Code → Add Custom Code
   - Cole o código de session tracking
   - Position: Head

2. **Tracking de formulário:**
   - Wix Forms → Settings → Actions → Add Action
   - Escolha "Code"
   - Cole código de tracking

### Webflow

1. **Project Settings → Custom Code → Head Code:**
   - Cole session tracking

2. **Form Settings → Success:**
   - Add custom code
   - Cole tracking de conversão

### Bubble.io

1. **SEO / Metatags → Script in body:**
   - Cole session tracking

2. **Workflow → When Form is submitted:**
   - Run JavaScript
   - Cole código de tracking

---

## ✅ Checklist de Implementação

- [ ] Supabase configurado (tabelas `leads` e `sessions`)
- [ ] Políticas RLS configuradas (anon pode INSERT/SELECT/UPDATE)
- [ ] Session tracking instalado no header
- [ ] Formulários com tracking de conversão
- [ ] Meta Pixel ID configurado
- [ ] Google Ads ID configurado
- [ ] Testado em ambiente de desenvolvimento
- [ ] Verificado no Supabase se dados estão sendo salvos
- [ ] Testado eventos no Meta Events Manager
- [ ] Testado conversões no Google Ads

---

## 🐛 Troubleshooting

### Sessões não estão sendo salvas

1. Verifique credenciais Supabase
2. Verifique políticas RLS
3. Abra Console (F12) e veja erros
4. Teste manualmente com curl:

```bash
curl -X POST 'https://SEU_PROJETO.supabase.co/rest/v1/sessions' \
  -H "apikey: SUA_ANON_KEY" \
  -H "Authorization: Bearer SUA_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "gtx_uid": "test_123",
    "session_id": "test_session_456",
    "landing_page": "/test"
  }'
```

### Leads não estão marcando sessão como convertida

1. Verifique se `markSessionAsConverted()` está sendo chamado
2. Verifique política RLS de UPDATE em `sessions`
3. Veja logs no Console do navegador

### Meta Pixel não está recebendo eventos

1. Verifique se `fbq` está definido: `console.log(window.fbq)`
2. Verifique Event Match Quality no Events Manager
3. Use Meta Pixel Helper (extensão Chrome)

---

## 📞 Suporte

Dúvidas? Entre em contato:
- **Email:** contato@agenciagtx.com.br
- **WhatsApp:** (19) 99012-2773

---

**GTX Agency** - Marketing de Performance com Tracking Profissional 🚀
