# 🎯 GTX Server-Side Tracking - Casos de Uso por Tipo de Cliente

Este documento apresenta implementações específicas para diferentes tipos de clientes e cenários reais.

---

## 📋 Índice

1. [Cliente sem site - Só roda tráfego pro WhatsApp](#1-cliente-sem-site---só-roda-tráfego-pro-whatsapp)
2. [E-commerce Shopify - Tracking completo](#2-e-commerce-shopify---tracking-completo)
3. [Clínica/Consultório - Agendamentos](#3-clínicaconsultório---agendamentos)
4. [Restaurante/Food - Pedidos pelo WhatsApp](#4-restaurantefood---pedidos-pelo-whatsapp)
5. [Imobiliária - Leads qualificados](#5-imobiliária---leads-qualificados)
6. [Infoprodutos - Webinar + Checkout](#6-infoprodutos---webinar--checkout)

---

## 1. Cliente sem site - Só roda tráfego pro WhatsApp

### Cenário
Cliente anuncia no Meta/Google mas não tem site. Clique vai direto pro WhatsApp.

**Problema:**
- ❌ Não consegue rastrear quantas pessoas clicaram
- ❌ Não sabe qual anúncio converteu
- ❌ Não consegue criar lookalikes precisos
- ❌ Perde dados de remarketing

### Solução: Micro Landing Page

**Estrutura:**

```
Anúncio Meta/Google
    ↓ (com UTMs)
Landing Page Ultra-Simples (1 tela)
    ↓
Formulário (Nome, Email, WhatsApp)
    ↓
Salva no Supabase + Dispara eventos
    ↓
Redireciona pro WhatsApp com mensagem pré-preenchida
```

### Implementação

**Arquivo: `index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quero Saber Mais - [Nome do Cliente]</title>

    <!-- Meta Pixel -->
    <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'SEU_PIXEL_ID');
    fbq('track', 'PageView');
    </script>

    <!-- Google Ads -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'AW-XXXXXXXXX');
    </script>

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
            text-align: center;
        }
        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        button {
            width: 100%;
            background: #25D366;
            color: white;
            border: none;
            padding: 18px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        button:hover {
            background: #20BA5A;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(37, 211, 102, 0.3);
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        .whatsapp-icon {
            width: 24px;
            height: 24px;
        }
        .loading {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .trust-badges {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        .badge {
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .badge-icon {
            font-size: 24px;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Quero Saber Mais!</h1>
        <p class="subtitle">Preencha seus dados e fale direto comigo no WhatsApp</p>

        <form id="leadForm">
            <div class="form-group">
                <label for="nome">Nome Completo *</label>
                <input type="text" id="nome" name="nome" required placeholder="Digite seu nome">
            </div>

            <div class="form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" name="email" required placeholder="seu@email.com">
            </div>

            <div class="form-group">
                <label for="telefone">WhatsApp *</label>
                <input type="tel" id="telefone" name="telefone" required placeholder="(11) 99999-9999">
            </div>

            <button type="submit" id="submitBtn">
                <svg class="whatsapp-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span id="btnText">Continuar no WhatsApp</span>
                <div class="loading" id="loading"></div>
            </button>
        </form>

        <div class="trust-badges">
            <div class="badge">
                <div class="badge-icon">🔒</div>
                <div>Seguro</div>
            </div>
            <div class="badge">
                <div class="badge-icon">⚡</div>
                <div>Resposta Rápida</div>
            </div>
            <div class="badge">
                <div class="badge-icon">✅</div>
                <div>Sem Spam</div>
            </div>
        </div>
    </div>

    <!-- GTX Tracking -->
    <script>
    // ============================================
    // CONFIGURAÇÃO
    // ============================================
    const GTX_CONFIG = {
        supabaseUrl: 'https://cffpqwynoftzqpdkaqoj.supabase.co',
        supabaseAnonKey: 'SUA_ANON_KEY_AQUI',
        whatsappNumber: '5511999999999', // ALTERE AQUI
        pixelId: 'SEU_PIXEL_ID',
        googleAdsId: 'AW-XXXXXXXXX',
        googleConversionLabel: 'CONVERSION_LABEL'
    };

    // ============================================
    // SESSION TRACKING
    // ============================================
    (function() {
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

        function getSessionID() {
            const storageKey = '_gtx_session_id';
            let sessionID = sessionStorage.getItem(storageKey);
            if (!sessionID) {
                sessionID = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem(storageKey, sessionID);
            }
            return sessionID;
        }

        function getCookie(name) {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? match[2] : null;
        }

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

        function getDeviceType() {
            const ua = navigator.userAgent.toLowerCase();
            if (/(tablet|ipad)/i.test(ua)) return 'tablet';
            if (/Mobile|Android|iP(hone|od)/.test(ua)) return 'mobile';
            return 'desktop';
        }

        function getBrowser() {
            const ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf('chrome') > -1 && ua.indexOf('edg') === -1) return 'chrome';
            if (ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1) return 'safari';
            if (ua.indexOf('firefox') > -1) return 'firefox';
            if (ua.indexOf('edg') > -1) return 'edge';
            return 'other';
        }

        function getOS() {
            const ua = navigator.userAgent.toLowerCase();
            if (ua.indexOf('win') > -1) return 'windows';
            if (ua.indexOf('mac') > -1) return 'mac';
            if (ua.indexOf('linux') > -1) return 'linux';
            if (ua.indexOf('android') > -1) return 'android';
            if (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1) return 'ios';
            return 'other';
        }

        async function trackSession() {
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

            try {
                await fetch(GTX_CONFIG.supabaseUrl + '/rest/v1/sessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': GTX_CONFIG.supabaseAnonKey,
                        'Authorization': 'Bearer ' + GTX_CONFIG.supabaseAnonKey,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify(sessionData)
                });
            } catch (error) {
                console.error('[GTX] Erro ao registrar sessão:', error);
            }
        }

        // Executar ao carregar
        trackSession();
    })();

    // ============================================
    // FORM SUBMISSION
    // ============================================
    document.getElementById('leadForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const loading = document.getElementById('loading');

        // Mostrar loading
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        loading.style.display = 'block';

        // Capturar dados do formulário
        const formData = new FormData(e.target);
        const nome = formData.get('nome');
        const email = formData.get('email');
        const telefone = formData.get('telefone');

        // Gerar Event ID
        const eventID = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Funções auxiliares
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

        // Preparar dados do lead
        const leadData = {
            gtx_uid: getGTXUserID(),
            event_id: eventID,
            nome: nome,
            email: email,
            telefone: telefone,
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc'),
            gclid: urlParams.get('gclid'),
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            utm_content: urlParams.get('utm_content'),
            utm_term: urlParams.get('utm_term'),
            user_agent: navigator.userAgent,
            url_origem: window.location.href,
            origem: 'micro_landing_page',
            status: 'novo'
        };

        try {
            // 1. Salvar no Supabase
            const response = await fetch(GTX_CONFIG.supabaseUrl + '/rest/v1/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': GTX_CONFIG.supabaseAnonKey,
                    'Authorization': 'Bearer ' + GTX_CONFIG.supabaseAnonKey,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(leadData)
            });

            const data = await response.json();

            // 2. Marcar sessão como convertida
            const sessionID = getSessionID();
            if (sessionID && data[0]?.id) {
                await fetch(GTX_CONFIG.supabaseUrl + '/rest/v1/sessions?session_id=eq.' + sessionID, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': GTX_CONFIG.supabaseAnonKey,
                        'Authorization': 'Bearer ' + GTX_CONFIG.supabaseAnonKey
                    },
                    body: JSON.stringify({
                        converted: true,
                        lead_id: data[0].id
                    })
                });
            }

            // 3. Enviar evento Lead para Meta Pixel
            if (window.fbq) {
                fbq('track', 'Lead', {
                    content_name: 'Micro Landing Page'
                }, { eventID: eventID });
            }

            // 4. Enviar conversão para Google Ads
            if (window.gtag) {
                gtag('event', 'conversion', {
                    'send_to': GTX_CONFIG.googleAdsId + '/' + GTX_CONFIG.googleConversionLabel
                });
            }

            // 5. Aguardar um pouco para garantir que salvou
            await new Promise(resolve => setTimeout(resolve, 500));

            // 6. Redirecionar para WhatsApp
            const mensagem = `Olá! Meu nome é ${nome}.\n\nAcabei de preencher o formulário no site e gostaria de saber mais sobre os serviços.`;
            const whatsappUrl = `https://wa.me/${GTX_CONFIG.whatsappNumber}?text=${encodeURIComponent(mensagem)}`;

            window.location.href = whatsappUrl;

        } catch (error) {
            console.error('[GTX] Erro:', error);
            alert('Ops! Algo deu errado. Tente novamente.');

            // Resetar botão
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            loading.style.display = 'none';
        }
    });
    </script>
</body>
</html>
```

### Deploy

**Opções:**

1. **Vercel (RECOMENDADO - Grátis):**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
cd pasta-do-cliente
vercel
```

2. **Netlify (Grátis):**
- Arraste a pasta no https://app.netlify.com/drop

3. **Hospedagem compartilhada:**
- Upload via FTP do arquivo `index.html`

### Configurar Anúncios

**Meta Ads:**
```
URL de destino: https://seudominio.com/?utm_source=facebook&utm_medium=cpc&utm_campaign=leads_whatsapp&fbclid={fbclid}
```

**Google Ads:**
```
URL de destino: https://seudominio.com/?utm_source=google&utm_medium=cpc&utm_campaign=leads_whatsapp&gclid={gclid}
```

---

## 2. E-commerce Shopify - Tracking Completo

### Objetivo
Rastrear jornada completa: visita → produto visualizado → carrinho → compra

### Eventos a rastrear

1. **PageView** - Visita à loja
2. **ViewContent** - Visualizou produto
3. **AddToCart** - Adicionou ao carrinho
4. **InitiateCheckout** - Iniciou checkout
5. **Purchase** - Comprou

### Implementação

Siga o guia completo em `IMPLEMENTACAO-PLATAFORMAS.md` seção Shopify.

**Diferencial: Product Catalog Sync**

Criar feed de produtos para Meta:

```liquid
<!-- snippets/gtx-product-feed.liquid -->
{% layout none %}
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>{{ shop.name }}</title>
    <link>{{ shop.url }}</link>
    <description>{{ shop.description }}</description>
    {% for product in collections.all.products %}
    <item>
      <g:id>{{ product.id }}</g:id>
      <g:title>{{ product.title }}</g:title>
      <g:description>{{ product.description | strip_html }}</g:description>
      <g:link>{{ shop.url }}{{ product.url }}</g:link>
      <g:image_link>{{ product.featured_image | img_url: 'grande' }}</g:image_link>
      <g:brand>{{ product.vendor }}</g:brand>
      <g:price>{{ product.price | money_without_currency }} BRL</g:price>
      <g:availability>{% if product.available %}in stock{% else %}out of stock{% endif %}</g:availability>
    </item>
    {% endfor %}
  </channel>
</rss>
```

URL do feed: `https://sualoja.com/pages/product-feed`

Enviar para Meta: **Commerce Manager → Data Sources → Add Product Feed**

---

## 3. Clínica/Consultório - Agendamentos

### Cenário
Clínica quer capturar leads e rastrear agendamentos confirmados.

### Fluxo

```
Landing Page
    ↓
Formulário: Nome, Email, Telefone, Especialidade
    ↓
Salva no Supabase (status: novo)
    ↓
Redireciona para calendário de agendamento
    ↓
Quando agenda: Webhook atualiza status para "agendado"
    ↓
Dispara evento "Schedule" no Meta
```

### Integração com Calendly

```javascript
// Adicionar no site após formulário
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js"></script>

<script>
// Após salvar lead no Supabase
const leadId = data[0].id;

// Abrir Calendly com dados pré-preenchidos
Calendly.initPopupWidget({
  url: 'https://calendly.com/seunome/consulta',
  prefill: {
    name: nome,
    email: email,
    customAnswers: {
      a1: telefone,
      a2: leadId // Passar ID do lead
    }
  }
});

// Escutar evento de agendamento
window.addEventListener('message', function(e) {
  if (e.data.event === 'calendly.event_scheduled') {
    // Atualizar lead no Supabase
    fetch(GTX_SUPABASE_URL + '/rest/v1/leads?id=eq.' + leadId, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': GTX_SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + GTX_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        status: 'agendado',
        data_agendamento: e.data.payload.event.start_time
      })
    });

    // Disparar evento no Meta
    if (window.fbq) {
      fbq('track', 'Schedule');
    }
  }
});
</script>
```

---

## 4. Restaurante/Food - Pedidos pelo WhatsApp

### Cenário
Restaurante que recebe pedidos pelo WhatsApp mas quer tracking.

### Implementação

**Cardápio Digital com Tracking:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Cardápio - [Nome do Restaurante]</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Session Tracking GTX -->
    <script src="gtx-tracking.js"></script>

    <style>
        /* Design do cardápio */
        .produto {
            display: flex;
            gap: 15px;
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        .produto-imagem {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 10px;
        }
        .produto-info {
            flex: 1;
        }
        .produto-nome {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 5px;
        }
        .produto-descricao {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        .produto-preco {
            font-size: 18px;
            color: #25D366;
            font-weight: 700;
        }
        .btn-pedir {
            background: #25D366;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
        }
        .carrinho-fixo {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #25D366;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 -5px 20px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Cardápio</h1>

        <!-- Produtos -->
        <div class="produto" data-nome="X-Burger Especial" data-preco="25.90">
            <img src="burger.jpg" class="produto-imagem">
            <div class="produto-info">
                <div class="produto-nome">X-Burger Especial</div>
                <div class="produto-descricao">Hambúrguer artesanal, queijo, alface, tomate</div>
                <div class="produto-preco">R$ 25,90</div>
            </div>
            <button class="btn-pedir" onclick="adicionarAoCarrinho(this)">Adicionar</button>
        </div>

        <!-- Mais produtos... -->
    </div>

    <div class="carrinho-fixo" id="carrinho" onclick="finalizarPedido()">
        <span id="carrinhoTexto">Selecione os itens</span>
    </div>

    <script>
    const GTX_CONFIG = {
        supabaseUrl: 'https://cffpqwynoftzqpdkaqoj.supabase.co',
        supabaseAnonKey: 'SUA_KEY',
        whatsappNumber: '5511999999999'
    };

    let carrinho = [];

    function adicionarAoCarrinho(btn) {
        const produto = btn.closest('.produto');
        const nome = produto.dataset.nome;
        const preco = parseFloat(produto.dataset.preco);

        carrinho.push({ nome, preco });

        // Evento ViewContent
        if (window.fbq) {
            fbq('track', 'ViewContent', {
                content_name: nome,
                value: preco,
                currency: 'BRL'
            });
        }

        atualizarCarrinho();
    }

    function atualizarCarrinho() {
        const total = carrinho.reduce((sum, item) => sum + item.preco, 0);
        const qtd = carrinho.length;

        document.getElementById('carrinhoTexto').textContent =
            qtd > 0 ? `${qtd} item(ns) - R$ ${total.toFixed(2)} - Finalizar Pedido` : 'Selecione os itens';
    }

    async function finalizarPedido() {
        if (carrinho.length === 0) return;

        // Pedir dados do cliente
        const nome = prompt('Qual seu nome?');
        if (!nome) return;

        const telefone = prompt('Qual seu WhatsApp? (com DDD)');
        if (!telefone) return;

        const endereco = prompt('Qual seu endereço completo?');
        if (!endereco) return;

        // Calcular total
        const total = carrinho.reduce((sum, item) => sum + item.preco, 0);

        // Gerar Event ID
        const eventID = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Preparar dados do pedido
        const leadData = {
            gtx_uid: getCookie('_gtx_uid'),
            event_id: eventID,
            nome: nome,
            telefone: telefone,
            mensagem: 'PEDIDO:\n' + carrinho.map(i => `- ${i.nome} (R$ ${i.preco})`).join('\n') + `\n\nENDEREÇO: ${endereco}\n\nTOTAL: R$ ${total.toFixed(2)}`,
            valor_venda: total,
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc'),
            user_agent: navigator.userAgent,
            url_origem: window.location.href,
            origem: 'cardapio_digital',
            status: 'novo'
        };

        try {
            // Salvar no Supabase
            const response = await fetch(GTX_CONFIG.supabaseUrl + '/rest/v1/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': GTX_CONFIG.supabaseAnonKey,
                    'Authorization': 'Bearer ' + GTX_CONFIG.supabaseAnonKey,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(leadData)
            });

            // Evento InitiateCheckout
            if (window.fbq) {
                fbq('track', 'InitiateCheckout', {
                    value: total,
                    currency: 'BRL',
                    num_items: carrinho.length
                }, { eventID: eventID });
            }

            // Montar mensagem WhatsApp
            const mensagem = `🍔 *NOVO PEDIDO*\n\n` +
                `👤 *Nome:* ${nome}\n` +
                `📍 *Endereço:* ${endereco}\n\n` +
                `*ITENS:*\n` +
                carrinho.map(i => `• ${i.nome} - R$ ${i.preco.toFixed(2)}`).join('\n') +
                `\n\n💰 *TOTAL: R$ ${total.toFixed(2)}*`;

            const whatsappUrl = `https://wa.me/${GTX_CONFIG.whatsappNumber}?text=${encodeURIComponent(mensagem)}`;

            window.location.href = whatsappUrl;

        } catch (error) {
            console.error('[GTX] Erro:', error);
            alert('Erro ao processar pedido. Tente novamente.');
        }
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }
    </script>
</body>
</html>
```

---

## 5. Imobiliária - Leads Qualificados

### Objetivo
Capturar interesse em imóveis específicos e qualificar leads.

### Implementação

**Botão "Tenho Interesse" em cada imóvel:**

```javascript
// Quando clicar em "Tenho Interesse"
async function interesseImovel(imovelId, imovelNome, imovelValor) {
    // Abrir modal para capturar dados
    const modal = `
        <div id="modalInteresse" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;">
            <div style="background:white;padding:30px;border-radius:15px;max-width:400px;width:90%;">
                <h2>Tenho Interesse</h2>
                <p>${imovelNome} - R$ ${imovelValor}</p>

                <input type="text" id="nomeInteressado" placeholder="Seu nome" style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:5px;">
                <input type="email" id="emailInteressado" placeholder="Seu email" style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:5px;">
                <input type="tel" id="telefoneInteressado" placeholder="Seu WhatsApp" style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:5px;">

                <select id="interesseNivel" style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:5px;">
                    <option value="">Quando pretende comprar/alugar?</option>
                    <option value="urgente">Esta semana</option>
                    <option value="curto_prazo">Este mês</option>
                    <option value="medio_prazo">Nos próximos 3 meses</option>
                    <option value="longo_prazo">Só pesquisando</option>
                </select>

                <button onclick="enviarInteresse('${imovelId}', '${imovelNome}', ${imovelValor})" style="width:100%;background:#25D366;color:white;border:none;padding:15px;border-radius:5px;font-weight:600;cursor:pointer;margin-top:10px;">
                    Enviar Interesse
                </button>

                <button onclick="document.getElementById('modalInteresse').remove()" style="width:100%;background:#ccc;color:#333;border:none;padding:10px;border-radius:5px;margin-top:10px;cursor:pointer;">
                    Cancelar
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

async function enviarInteresse(imovelId, imovelNome, imovelValor) {
    const nome = document.getElementById('nomeInteressado').value;
    const email = document.getElementById('emailInteressado').value;
    const telefone = document.getElementById('telefoneInteressado').value;
    const nivel = document.getElementById('interesseNivel').value;

    if (!nome || !email || !telefone || !nivel) {
        alert('Preencha todos os campos');
        return;
    }

    const eventID = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Determinar prioridade do lead
    const prioridade = {
        'urgente': 'alta',
        'curto_prazo': 'alta',
        'medio_prazo': 'media',
        'longo_prazo': 'baixa'
    }[nivel];

    const leadData = {
        gtx_uid: getCookie('_gtx_uid'),
        event_id: eventID,
        nome: nome,
        email: email,
        telefone: telefone,
        mensagem: `Interesse no imóvel: ${imovelNome}\nValor: R$ ${imovelValor}\nUrgência: ${nivel}`,
        valor_venda: imovelValor,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
        user_agent: navigator.userAgent,
        url_origem: window.location.href,
        origem: 'site_imoveis',
        status: prioridade === 'alta' ? 'qualificado' : 'novo'
    };

    try {
        // Salvar no Supabase
        await fetch(GTX_SUPABASE_URL + '/rest/v1/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': GTX_SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + GTX_SUPABASE_ANON_KEY
            },
            body: JSON.stringify(leadData)
        });

        // Evento Lead
        if (window.fbq) {
            fbq('track', 'Lead', {
                content_name: imovelNome,
                value: imovelValor,
                currency: 'BRL'
            }, { eventID: eventID });
        }

        // Redirecionar para WhatsApp
        const mensagem = `Olá! Tenho interesse no imóvel:\n\n${imovelNome}\nR$ ${imovelValor}\n\nMeu nome é ${nome} e gostaria de agendar uma visita.`;
        const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(mensagem)}`;

        window.location.href = whatsappUrl;

    } catch (error) {
        console.error('[GTX] Erro:', error);
        alert('Erro ao enviar. Tente novamente.');
    }
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}
```

---

## 6. Infoprodutos - Webinar + Checkout

### Fluxo Completo

```
Landing Page de Webinar
    ↓
Cadastro (Nome, Email) - evento "CompleteRegistration"
    ↓
Página de Confirmação
    ↓
Email com link do webinar
    ↓
Assiste webinar (rastrear tempo assistido)
    ↓
Checkout - evento "InitiateCheckout"
    ↓
Compra - evento "Purchase"
```

### Implementação

**Landing Page Webinar:**

```html
<form id="webinarForm">
    <input type="text" name="nome" placeholder="Seu nome" required>
    <input type="email" name="email" placeholder="Seu melhor email" required>
    <button type="submit">QUERO PARTICIPAR DO WEBINAR GRATUITO</button>
</form>

<script>
document.getElementById('webinarForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const eventID = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const leadData = {
        gtx_uid: getCookie('_gtx_uid'),
        event_id: eventID,
        nome: formData.get('nome'),
        email: formData.get('email'),
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
        user_agent: navigator.userAgent,
        url_origem: window.location.href,
        origem: 'webinar_landing',
        status: 'inscrito_webinar'
    };

    // Salvar no Supabase
    await fetch(GTX_SUPABASE_URL + '/rest/v1/leads', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': GTX_SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + GTX_SUPABASE_ANON_KEY
        },
        body: JSON.stringify(leadData)
    });

    // Evento CompleteRegistration
    if (window.fbq) {
        fbq('track', 'CompleteRegistration', {
            content_name: 'Webinar Gratuito'
        }, { eventID: eventID });
    }

    // Redirecionar para página de confirmação
    window.location.href = '/confirmacao?email=' + encodeURIComponent(formData.get('email'));
});
</script>
```

**Página do Webinar (rastrear engajamento):**

```html
<video id="webinarVideo" controls>
    <source src="webinar.mp4" type="video/mp4">
</video>

<script>
const video = document.getElementById('webinarVideo');

// Rastrear marcos de visualização
const milestones = [25, 50, 75, 100];
let milestonesReached = [];

video.addEventListener('timeupdate', function() {
    const percent = (video.currentTime / video.duration) * 100;

    milestones.forEach(milestone => {
        if (percent >= milestone && !milestonesReached.includes(milestone)) {
            milestonesReached.push(milestone);

            // Enviar evento customizado
            if (window.fbq) {
                fbq('trackCustom', 'WebinarProgress', {
                    progress: milestone
                });
            }

            console.log(`Usuário assistiu ${milestone}% do webinar`);
        }
    });
});

// Quando terminar o vídeo, mostrar CTA de checkout
video.addEventListener('ended', function() {
    document.getElementById('checkoutCTA').style.display = 'block';

    if (window.fbq) {
        fbq('trackCustom', 'WebinarCompleted');
    }
});
</script>
```

---

## 📊 Dashboard de Análise

Para todos os casos de uso, crie queries no Supabase para análise:

```sql
-- Leads por origem
SELECT origem, COUNT(*) as total
FROM leads
GROUP BY origem
ORDER BY total DESC;

-- Taxa de conversão por UTM
SELECT
    utm_source,
    utm_campaign,
    COUNT(*) as total_sessoes,
    COUNT(*) FILTER (WHERE converted = true) as sessoes_convertidas,
    ROUND((COUNT(*) FILTER (WHERE converted = true)::numeric / COUNT(*)) * 100, 2) as taxa_conversao
FROM sessions
GROUP BY utm_source, utm_campaign
ORDER BY taxa_conversao DESC;

-- Valor médio de venda por origem
SELECT
    origem,
    COUNT(*) as total_leads,
    AVG(valor_venda) as valor_medio,
    SUM(valor_venda) as receita_total
FROM leads
WHERE valor_venda IS NOT NULL
GROUP BY origem
ORDER BY receita_total DESC;
```

---

**GTX Agency** - Tracking Profissional para Todos os Tipos de Negócio 🚀
