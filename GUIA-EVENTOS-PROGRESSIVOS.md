# 🎯 GTX - Sistema de Eventos Progressivos para Meta

Guia completo de como usar o sistema de 3 eventos: Lead → Qualified → Purchase

---

## 📊 Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│  EVENTO 1: LEAD (Preencheu Formulário)                      │
│                                                              │
│  Script: sync-leads-to-meta.js                              │
│  Roda a cada: 15 minutos                                    │
│  Filtro: status = 'novo'                                    │
│  Evento Meta: "Lead"                                        │
│  Campo marcado: enviado_meta_lead = true                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
              Você liga/conversa no WhatsApp
                           ↓
              Atualiza status para "qualificado"
                    (admin/atualizar-leads.html)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  EVENTO 2: QUALIFIED (Lead Qualificado)                     │
│                                                              │
│  Script: sync-qualified-to-meta.js                          │
│  Roda a cada: 1 hora                                        │
│  Filtro: status = 'qualificado' OU 'reuniao_agendada'      │
│  Evento Meta: "SubmitApplication"                           │
│  Campo marcado: enviado_meta_qualified = true               │
└─────────────────────────────────────────────────────────────┘
                           ↓
              Lead agenda reunião / fecha negócio
                           ↓
            Atualiza status para "fechado" + valor_venda
                    (admin/atualizar-leads.html)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  EVENTO 3: PURCHASE (Negócio Fechado)                       │
│                                                              │
│  Script: sync-purchases-to-meta.js                          │
│  Roda a cada: 6 horas                                       │
│  Filtro: status = 'fechado'                                 │
│  Evento Meta: "Purchase" (com valor)                        │
│  Campo marcado: enviado_meta_purchase = true                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Configuração Inicial

### Passo 1: Adicionar Colunas no Supabase

Execute este SQL no Supabase SQL Editor:

```sql
-- Adicionar colunas de controle de envio
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS enviado_meta_qualified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS enviado_meta_purchase BOOLEAN DEFAULT FALSE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_enviado_meta_qualified
ON public.leads(enviado_meta_qualified);

CREATE INDEX IF NOT EXISTS idx_leads_enviado_meta_purchase
ON public.leads(enviado_meta_purchase);

-- Verificar estrutura
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name LIKE 'enviado_meta%'
ORDER BY column_name;
```

**Resultado esperado:**
```
enviado_meta_lead       | boolean | false
enviado_meta_purchase   | boolean | false
enviado_meta_qualified  | boolean | false
```

---

### Passo 2: Configurar os 3 Scripts

Todos os scripts já estão criados em `scripts/`:
- ✅ `sync-leads-to-meta.js` (Evento "Lead")
- ✅ `sync-qualified-to-meta.js` (Evento "SubmitApplication")
- ✅ `sync-purchases-to-meta.js` (Evento "Purchase")

**Verifique a configuração:**

```bash
cd /Users/guilhermeteixeira/Documents/AGENCIA\ GTX./SERVER-SIDE

# Ver configuração de cada script
grep -A 10 "filters:" scripts/sync-leads-to-meta.js
grep -A 10 "filters:" scripts/sync-qualified-to-meta.js
grep -A 10 "filters:" scripts/sync-purchases-to-meta.js
```

---

### Passo 3: Testar Cada Script

```bash
# 1. Testar sync de leads (novos)
node scripts/sync-leads-to-meta.js

# 2. Testar sync de qualificados
node scripts/sync-qualified-to-meta.js

# 3. Testar sync de purchases
node scripts/sync-purchases-to-meta.js
```

**Importante:** Os scripts estão em `dryRun: true` por padrão.

Mude para `dryRun: false` quando estiver pronto:

```javascript
// Em cada script
mode: {
  dryRun: false,  // ✅ Mudar para false
  verbose: true
}
```

---

### Passo 4: Automatizar com PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Script 1: Leads novos (a cada 15 minutos)
pm2 start scripts/sync-leads-to-meta.js \
  --name "gtx-meta-leads" \
  --cron "*/15 * * * *"

# Script 2: Leads qualificados (a cada 1 hora)
pm2 start scripts/sync-qualified-to-meta.js \
  --name "gtx-meta-qualified" \
  --cron "0 * * * *"

# Script 3: Purchases (a cada 6 horas)
pm2 start scripts/sync-purchases-to-meta.js \
  --name "gtx-meta-purchases" \
  --cron "0 */6 * * *"

# Ver status
pm2 list

# Ver logs
pm2 logs gtx-meta-leads
pm2 logs gtx-meta-qualified
pm2 logs gtx-meta-purchases

# Salvar configuração (reinicia após reboot)
pm2 save
pm2 startup
```

---

## 🖥️ Interface de Atualização de Leads

### Abrir Interface

```bash
# Opção 1: Abrir arquivo HTML diretamente
open /Users/guilhermeteixeira/Documents/AGENCIA\ GTX./SERVER-SIDE/admin/atualizar-leads.html

# Opção 2: Servir com servidor local
cd /Users/guilhermeteixeira/Documents/AGENCIA\ GTX./SERVER-SIDE/admin
python3 -m http.server 8000

# Depois abra: http://localhost:8000/atualizar-leads.html
```

### Configurar Credenciais

Na interface, preencha:
- **Supabase URL:** `https://cffpqwynoftzqpdkaqoj.supabase.co`
- **Service Role Key:** `eyJhbGci...` (SERVICE ROLE, não anon)

Clique em "Carregar Leads"

### Usar a Interface

**1. Qualificar Lead:**
- Lead novo aparece
- Botão "✅ Qualificar"
- Status muda para "qualificado"
- Script `sync-qualified-to-meta.js` pega esse lead na próxima execução

**2. Agendar Reunião:**
- Lead qualificado
- Botão "📅 Agendar Reunião"
- Status muda para "reuniao_agendada"

**3. Fechar Negócio:**
- Botão "💰 Fechar Negócio"
- Modal abre pedindo valor
- Digite o valor (ex: 5000)
- Status muda para "fechado" + valor_venda salvo
- Script `sync-purchases-to-meta.js` pega esse lead

---

## 📱 Fluxo de Trabalho Real

### Cenário: Lead novo chegou

**1. Lead preenche formulário no site**
```
Nome: João Silva
Email: joao@email.com
Telefone: 11999999999
Status: novo
```

**2. Script roda automaticamente (15 min)**
```bash
[GTX Meta Leads] Enviando lead para Meta...
✅ Lead enviado: João Silva
Campo marcado: enviado_meta_lead = true
Evento Meta: "Lead"
```

**3. Você liga pro João**
- João responde
- Demonstra interesse
- Tem budget
- É tomador de decisão

**4. Você abre admin/atualizar-leads.html**
- Procura "João Silva"
- Clica em "✅ Qualificar"
- Status muda para "qualificado"

**5. Script roda automaticamente (1h depois)**
```bash
[GTX Meta Qualified] Enviando lead qualificado...
✅ Lead enviado: João Silva
Campo marcado: enviado_meta_qualified = true
Evento Meta: "SubmitApplication"
```

**6. João agenda reunião**
- Interface → Botão "📅 Agendar Reunião"
- Status: "reuniao_agendada"

**7. Reunião acontece e João fecha**
- Interface → Botão "💰 Fechar Negócio"
- Digite valor: R$ 5.000,00
- Status: "fechado" + valor_venda: 5000

**8. Script roda automaticamente (6h depois)**
```bash
[GTX Meta Purchases] Enviando purchase...
✅ Purchase enviado: João Silva - R$ 5000.00
Campo marcado: enviado_meta_purchase = true
Evento Meta: "Purchase" (value: 5000)
```

---

## 📊 Monitoramento

### Ver status dos leads

```sql
-- Leads e seus status de envio
SELECT
  nome,
  email,
  status,
  valor_venda,
  enviado_meta_lead,
  enviado_meta_qualified,
  enviado_meta_purchase,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 20;
```

### Estatísticas de envio

```sql
-- Quantos leads foram enviados em cada etapa
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE enviado_meta_lead = true) as enviados_lead,
  COUNT(*) FILTER (WHERE enviado_meta_qualified = true) as enviados_qualified,
  COUNT(*) FILTER (WHERE enviado_meta_purchase = true) as enviados_purchase
FROM leads;
```

### Funil de conversão

```sql
-- Taxa de conversão por etapa
SELECT
  'Lead' as etapa,
  COUNT(*) as total
FROM leads
WHERE enviado_meta_lead = true

UNION ALL

SELECT
  'Qualified' as etapa,
  COUNT(*) as total
FROM leads
WHERE enviado_meta_qualified = true

UNION ALL

SELECT
  'Purchase' as etapa,
  COUNT(*) as total
FROM leads
WHERE enviado_meta_purchase = true;
```

---

## 🎯 Verificar no Meta

### Meta Events Manager

1. Acesse: https://business.facebook.com/events_manager2
2. Selecione seu Pixel (611003988383118)
3. Vá em **Overview**

Você verá 3 eventos:
- 🟢 **Lead** (formulário preenchido)
- 🔵 **SubmitApplication** (lead qualificado)
- 🟡 **Purchase** (negócio fechado)

### Test Events (Tempo Real)

1. Meta Events Manager → **Test Events**
2. Execute qualquer script
3. Veja eventos chegando em tempo real

### Event Match Quality

1. Meta Events Manager → **Data Sources → Quality**
2. Objetivo: **Good** ou **Great**
3. Quanto mais dados (email, phone, fbp, fbc), melhor

---

## 🚀 Criando Campanhas Otimizadas

### Campanha 1: Gerar Leads

**Objetivo:** Conversão → Lead

**Otimizar para:** Evento "Lead" do Pixel

**Público:**
- Cold traffic (interesse: marketing digital, agências)
- Lookalike 1% de quem preencheu formulário

**Resultado:** Meta busca pessoas que preenchem formulários

---

### Campanha 2: Leads Qualificados

**Objetivo:** Conversão → SubmitApplication

**Otimizar para:** Evento "SubmitApplication" do Pixel

**Público:**
- Lookalike 1% de leads qualificados
- Remarketing: visitou site mas não preencheu

**Resultado:** Meta busca pessoas que realmente engajam

---

### Campanha 3: Clientes (ROAS Máximo)

**Objetivo:** Conversão → Purchase

**Otimizar para:** Evento "Purchase" do Pixel

**Público:**
- Lookalike 1% de compradores
- Lookalike de valor alto (>R$ 5.000)

**Resultado:** Meta busca pessoas que COMPRAM

---

## 🔧 Troubleshooting

### Lead não está sendo enviado

**1. Verificar se script rodou:**
```bash
pm2 logs gtx-meta-leads --lines 50
```

**2. Verificar filtros:**
```sql
SELECT * FROM leads WHERE enviado_meta_lead = false LIMIT 5;
```

Se aparecer leads, scripts devem pegá-los.

**3. Rodar manual:**
```bash
node scripts/sync-leads-to-meta.js
```

---

### Qualified não está sendo enviado

**Causa comum:** Status não está "qualificado" ou "reuniao_agendada"

**Solução:**
```sql
-- Ver status atual
SELECT nome, status FROM leads WHERE id = 'xxx';

-- Atualizar se necessário
UPDATE leads SET status = 'qualificado' WHERE id = 'xxx';
```

---

### Purchase não está sendo enviado

**Causa comum:** Status não está "fechado" ou falta valor_venda

**Solução:**
```sql
-- Verificar
SELECT nome, status, valor_venda FROM leads WHERE id = 'xxx';

-- Corrigir
UPDATE leads
SET status = 'fechado', valor_venda = 5000
WHERE id = 'xxx';
```

---

## ✅ Checklist de Implementação

### Inicial
- [ ] Colunas adicionadas no Supabase
- [ ] 3 scripts criados e testados
- [ ] Scripts rodados em dry run (sucesso)
- [ ] Scripts configurados com dryRun: false
- [ ] PM2 configurado e rodando
- [ ] Interface admin/atualizar-leads.html funcionando

### Validação
- [ ] Lead novo → Enviou evento "Lead" na Meta
- [ ] Lead qualificado → Enviou evento "SubmitApplication"
- [ ] Lead fechado → Enviou evento "Purchase"
- [ ] Event Match Quality: Good ou Great
- [ ] Logs do PM2 sem erros

### Operacional
- [ ] Time treinado para usar interface
- [ ] Processo definido (quando qualificar?)
- [ ] Campanhas Meta criadas para cada evento
- [ ] Lookalikes criados
- [ ] Monitoramento configurado

---

## 📞 Próximos Passos

1. ✅ **Rodar por 2 semanas coletando dados**
2. ✅ **Analisar: Qual etapa tem melhor ROAS?**
3. ✅ **Criar campanhas separadas por etapa**
4. ✅ **Comparar performance**
5. ✅ **Escalar o que funciona**

---

**GTX Agency** - Marketing Data-Driven com Eventos Progressivos 🚀
