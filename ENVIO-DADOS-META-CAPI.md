# 🎯 GTX - Envio de Dados para Meta CAPI

Guia completo de como enviar leads do Supabase para Meta Conversions API com filtros de qualificação.

---

## 📋 Visão Geral

### Fluxo Atual
```
Usuário preenche formulário
    ↓
Dados salvos no Supabase (tabela leads)
    ↓
Evento "Lead" disparado no Meta Pixel (client-side)
    ↓
FIM
```

### Novo Fluxo (Server-Side)
```
Usuário preenche formulário
    ↓
Dados salvos no Supabase (tabela leads)
    ↓
Evento "Lead" disparado no Meta Pixel (client-side)
    ↓
Script roda a cada X minutos
    ↓
Busca leads novos no Supabase
    ↓
FILTRA leads relevantes (você decide critérios)
    ↓
Envia para Meta CAPI (server-side)
    ↓
Marca lead como "enviado_meta_lead = true"
```

**Vantagem:** Você **controla** quais leads vão para Meta, melhorando a qualidade dos dados.

---

## 🤔 Estratégia de Qualificação de Leads

### Opção 1: Enviar TODOS os leads (Fase Inicial)

**Quando usar:**
- Começando campanhas agora
- Precisa de volume de dados
- Ainda não tem critérios de qualificação definidos

**Configuração:**
```javascript
filters: {
  onlyNotSent: true,
  requireEmail: true,
  requirePhone: false,
  statusFilter: [],      // Vazio = todos
  origemFilter: [],      // Vazio = todas
  maxAgeHours: null,     // Sem limite
  limit: 100
}
```

**Resultado:**
- Meta recebe TODOS os leads
- Algoritmo aprende com todos os tipos
- Lookalikes baseados em "quem preenche formulário"

---

### Opção 2: Enviar apenas leads QUALIFICADOS (Recomendado)

**Quando usar:**
- Já tem volume de leads
- Sabe diferenciar lead bom de ruim
- Quer lookalikes mais precisos

**Critérios de qualificação (exemplos):**

**A. Por origem:**
```javascript
origemFilter: ['landing_page_modal', 'micro_landing_page']
// Ignora leads de teste ou origens ruins
```

**B. Por status:**
```javascript
statusFilter: ['qualificado', 'reuniao_agendada', 'fechado']
// Só envia leads que já avançaram no funil
```

**C. Por tempo de resposta:**
```javascript
maxAgeHours: 24
// Só envia leads das últimas 24h (mais quentes)
```

**D. Por completude de dados:**
```javascript
requireEmail: true,
requirePhone: true
// Só envia se tiver email E telefone
```

**Configuração completa:**
```javascript
filters: {
  onlyNotSent: true,
  requireEmail: true,
  requirePhone: true,
  statusFilter: ['qualificado', 'fechado'],
  origemFilter: ['landing_page_modal'],
  maxAgeHours: 48,
  limit: 100
}
```

**Resultado:**
- Meta recebe apenas leads de alta qualidade
- Lookalikes muito mais precisos
- Custo por lead qualificado diminui

---

### Opção 3: Envio em ETAPAS (Avançado)

Enviar diferentes eventos conforme lead avança no funil:

```
Lead preencheu formulário → Meta CAPI evento "Lead"
    ↓
Respondeu WhatsApp → Meta CAPI evento "Contact"
    ↓
Agendou reunião → Meta CAPI evento "Schedule"
    ↓
Fechou negócio → Meta CAPI evento "Purchase"
```

**Benefício:** Meta otimiza para cada etapa do funil.

**Como implementar:**

Criar 3 scripts separados:

1. `sync-leads-to-meta.js` - Envia evento "Lead"
2. `sync-qualified-to-meta.js` - Envia evento "SubmitApplication"
3. `sync-purchases-to-meta.js` - Envia evento "Purchase"

Cada um com filtros diferentes.

---

## 🚀 Configuração e Uso

### Passo 1: Instalar Dependências

```bash
cd /Users/guilhermeteixeira/Documents/AGENCIA\ GTX./SERVER-SIDE

# Se ainda não tem node_modules
npm init -y
npm install dotenv
```

### Passo 2: Configurar .env

Edite `config/.env`:

```env
# Supabase (tracking database)
SUPABASE_URL=https://cffpqwynoftzqpdkaqoj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # SERVICE ROLE (não anon)

# Meta
META_PIXEL_ID=611003988383118
META_ACCESS_TOKEN=EAANah2CP0DwBQ... # Seu token de acesso
```

**IMPORTANTE:** Use **SERVICE_ROLE_KEY** (não anon key) para ter permissão de UPDATE.

---

### Passo 3: Configurar Filtros

Edite `scripts/sync-leads-to-meta.js` na seção CONFIG:

```javascript
const CONFIG = {
  // ... (não mude Supabase e Meta)

  // 👇 CUSTOMIZE AQUI
  filters: {
    onlyNotSent: true,        // ✅ Manter true
    requireEmail: true,        // ✅ Recomendado true
    requirePhone: false,       // Você decide
    statusFilter: [],          // Ex: ['qualificado', 'fechado']
    origemFilter: [],          // Ex: ['landing_page_modal']
    maxAgeHours: null,         // Ex: 24 para últimas 24h
    limit: 100                 // Máximo por execução
  },

  mode: {
    dryRun: true,   // ⚠️ true = TESTE (não envia)
    verbose: true   // true = mostra logs
  }
};
```

---

### Passo 4: Testar em DRY RUN

```bash
cd /Users/guilhermeteixeira/Documents/AGENCIA\ GTX./SERVER-SIDE

node scripts/sync-leads-to-meta.js
```

**Output esperado:**
```
🚀 GTX - Sync Leads to Meta CAPI
==================================

⚠️  MODO DRY RUN - Nenhum dado será enviado para Meta

🔍 Buscando leads no Supabase...
✅ Encontrados 3 leads para processar

📤 Processando lead: abc-123 - Guilherme (guilherme@email.com)
🔵 [DRY RUN] Payload que seria enviado: {
  "data": [{
    "event_name": "Lead",
    "event_time": 1772921763,
    "event_id": "evt_1772921763852_k2gvg1pmb",
    ...
  }]
}

==================================
📊 RESUMO DA EXECUÇÃO
==================================
✅ Enviados com sucesso: 3
❌ Erros: 0
📝 Total processado: 3

⚠️  Lembre-se: Este foi um DRY RUN. Nenhum dado foi enviado.
```

---

### Passo 5: Ativar Envio Real

Edite `sync-leads-to-meta.js`:

```javascript
mode: {
  dryRun: false,  // ✅ Mudou para false
  verbose: true
}
```

Execute novamente:

```bash
node scripts/sync-leads-to-meta.js
```

**Output esperado:**
```
🚀 GTX - Sync Leads to Meta CAPI
==================================

🔍 Buscando leads no Supabase...
✅ Encontrados 3 leads para processar

📤 Processando lead: abc-123 - Guilherme
✅ Lead enviado para Meta: abc-123

==================================
📊 RESUMO DA EXECUÇÃO
==================================
✅ Enviados com sucesso: 3
❌ Erros: 0
📝 Total processado: 3
```

---

### Passo 6: Automatizar Execução

**Opção A: Cron (Linux/Mac)**

```bash
# Editar crontab
crontab -e

# Adicionar linha (roda a cada 15 minutos)
*/15 * * * * cd /Users/guilhermeteixeira/Documents/AGENCIA\ GTX./SERVER-SIDE && node scripts/sync-leads-to-meta.js >> logs/sync.log 2>&1
```

**Opção B: PM2 (Recomendado)**

```bash
# Instalar PM2
npm install -g pm2

# Criar script que roda periodicamente
pm2 start scripts/sync-leads-to-meta.js --name "gtx-meta-sync" --cron "*/15 * * * *"

# Ver logs
pm2 logs gtx-meta-sync

# Salvar para reiniciar após reboot
pm2 save
pm2 startup
```

**Opção C: Render/Railway (Cloud - Grátis)**

Deploy no Render.com com Cron Job:

```yaml
# render.yaml
services:
  - type: cron
    name: gtx-meta-sync
    env: node
    schedule: "*/15 * * * *"
    buildCommand: npm install
    startCommand: node scripts/sync-leads-to-meta.js
```

---

## 📊 Monitoramento

### Ver quais leads foram enviados

```sql
-- Leads enviados para Meta
SELECT id, nome, email, telefone, origem, status, created_at
FROM leads
WHERE enviado_meta_lead = true
ORDER BY created_at DESC
LIMIT 20;

-- Leads ainda não enviados
SELECT id, nome, email, telefone, origem, status, created_at
FROM leads
WHERE enviado_meta_lead = false
ORDER BY created_at DESC
LIMIT 20;

-- Estatísticas
SELECT
  enviado_meta_lead,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE email IS NOT NULL) as com_email,
  COUNT(*) FILTER (WHERE telefone IS NOT NULL) as com_telefone
FROM leads
GROUP BY enviado_meta_lead;
```

### Verificar no Meta Events Manager

1. Acesse https://business.facebook.com/events_manager2
2. Selecione seu Pixel
3. Vá em **Test Events**
4. Execute o script
5. Veja eventos chegando em tempo real

---

## 🎯 Estratégias por Objetivo

### Objetivo: Maximizar Volume de Leads

```javascript
filters: {
  onlyNotSent: true,
  requireEmail: true,      // Exige email (melhora Match Quality)
  requirePhone: false,     // Não exige telefone
  statusFilter: [],        // Todos os status
  origemFilter: [],        // Todas as origens
  maxAgeHours: null,
  limit: 100
}
```

**Resultado:** Meta otimiza para volume.

---

### Objetivo: Leads Qualificados (Sales)

```javascript
filters: {
  onlyNotSent: true,
  requireEmail: true,
  requirePhone: true,      // Exige telefone
  statusFilter: ['qualificado', 'reuniao_agendada', 'fechado'],
  origemFilter: ['landing_page_modal'],
  maxAgeHours: 72,         // Últimos 3 dias
  limit: 50
}
```

**Resultado:** Meta otimiza para leads que viraram reunião.

---

### Objetivo: Apenas Clientes Fechados (Lookalike de Compradores)

```javascript
filters: {
  onlyNotSent: true,
  requireEmail: true,
  requirePhone: true,
  statusFilter: ['fechado'],  // Apenas fechados
  origemFilter: [],
  maxAgeHours: null,
  limit: 50
}
```

**Resultado:** Lookalike de quem realmente comprou.

---

## 🔄 Fluxo de Eventos Progressivos (Avançado)

Para implementar envio em etapas, crie 3 scripts:

### Script 1: Lead (quando preenche formulário)

**Arquivo:** `sync-leads-to-meta.js` (já criado)

```javascript
statusFilter: ['novo']  // Apenas leads novos
```

**Evento enviado:** `Lead`

---

### Script 2: Qualified Lead (quando qualifica)

**Arquivo:** `sync-qualified-to-meta.js`

Copie `sync-leads-to-meta.js` e mude:

```javascript
// Buscar leads qualificados não enviados
query += '&enviado_meta_qualified=eq.false';
query += '&status=in.(qualificado,reuniao_agendada)';

// Evento
event_name: 'SubmitApplication'

// Marcar como enviado
enviado_meta_qualified: true
```

**Evento enviado:** `SubmitApplication`

---

### Script 3: Purchase (quando fecha)

**Arquivo:** `sync-purchases-to-meta.js`

Copie `sync-leads-to-meta.js` e mude:

```javascript
// Buscar compras não enviadas
query += '&enviado_meta_purchase=eq.false';
query += '&status=eq.fechado';

// Evento
event_name: 'Purchase'

// Custom data
custom_data: {
  value: lead.valor_venda,
  currency: 'BRL',
  content_name: lead.origem
}

// Marcar como enviado
enviado_meta_purchase: true
```

**Evento enviado:** `Purchase`

---

### Executar os 3 scripts

```bash
# A cada 15 minutos
pm2 start scripts/sync-leads-to-meta.js --name "meta-leads" --cron "*/15 * * * *"

# A cada 1 hora
pm2 start scripts/sync-qualified-to-meta.js --name "meta-qualified" --cron "0 * * * *"

# A cada 6 horas
pm2 start scripts/sync-purchases-to-meta.js --name "meta-purchases" --cron "0 */6 * * *"
```

---

## 📈 Event Match Quality

Para maximizar o Event Match Quality no Meta:

### Obrigatórios
- ✅ `email` (hashed)
- ✅ `event_id` (deduplicação)

### Recomendados
- ✅ `phone` (hashed)
- ✅ `first_name` (hashed)
- ✅ `last_name` (hashed)
- ✅ `fbp` (cookie Meta)
- ✅ `fbc` (Facebook Click ID)
- ✅ `client_ip_address`
- ✅ `client_user_agent`

**Nosso script já envia todos esses dados quando disponíveis!**

---

## 🐛 Troubleshooting

### Leads não estão sendo enviados

1. **Verifique credenciais:**
```bash
node -e "require('dotenv').config({path:'./config/.env'}); console.log(process.env.META_PIXEL_ID)"
```

2. **Verifique se há leads novos:**
```sql
SELECT COUNT(*) FROM leads WHERE enviado_meta_lead = false;
```

3. **Rode em verbose:**
```javascript
mode: {
  verbose: true
}
```

---

### Meta retorna erro

**Erro comum: "Invalid OAuth access token"**

Solução: Token expirou. Gerar novo token em:
https://developers.facebook.com/tools/explorer/

Selecione:
- App correto
- Permissões: `ads_management`, `business_management`
- Gerar Access Token
- Copiar token **LONG-LIVED** (dura 60 dias)

---

### Event Match Quality baixo

**Causas:**
- Falta de dados (email, telefone)
- Cookies `fbp`/`fbc` vazios (acesso direto)
- IP ou User Agent faltando

**Solução:**
1. Exigir email sempre: `requireEmail: true`
2. Incentivar vinda de ads Meta (fbp/fbc preenchidos)
3. Capturar IP no servidor

---

## ✅ Checklist de Implementação

- [ ] Script criado em `scripts/sync-leads-to-meta.js`
- [ ] `.env` configurado com credentials
- [ ] Testado em DRY RUN (`dryRun: true`)
- [ ] Filtros de qualificação definidos
- [ ] Enviado leads reais (`dryRun: false`)
- [ ] Verificado no Meta Events Manager
- [ ] Automatizado com PM2 ou Cron
- [ ] Monitoramento configurado

---

## 🎯 Próximos Passos

1. **Criar Lookalike Audiences no Meta:**
   - Audiences → Create Audience → Lookalike Audience
   - Source: Pixel events "Lead" ou "Purchase"
   - Location: Brasil
   - Size: 1% (mais similar)

2. **Criar Custom Audiences para Remarketing:**
   - Website Visitors → Últimos 30 dias
   - Lead Form → Quem preencheu mas não comprou

3. **Otimizar Campanhas:**
   - Objetivo: Conversão → Lead
   - Otimizar para: Evento "Lead" do Pixel
   - Meta vai buscar pessoas similares

---

**GTX Agency** - Server-Side Tracking Profissional 🚀
