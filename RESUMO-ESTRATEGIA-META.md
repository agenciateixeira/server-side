# 🎯 GTX - Estratégia de Qualificação e Envio para Meta

## 📊 Resumo Executivo

Este documento explica **onde e como qualificar leads** antes de enviar para Meta CAPI.

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│  1. CAPTURA (Site agenciagtx.com.br)                        │
│                                                              │
│  Usuário preenche formulário WhatsApp                       │
│  ↓                                                           │
│  Salva no Supabase (tabela "leads")                         │
│  • nome, email, telefone, mensagem                          │
│  • fbp, fbc, gclid, UTMs                                    │
│  • status: "novo"                                           │
│  • enviado_meta_lead: false                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. QUALIFICAÇÃO (Você decide os critérios)                 │
│                                                              │
│  🔹 Opção A: Manual (HubSpot CRM)                           │
│     • Importa leads do Supabase                             │
│     • Você liga, qualifica                                  │
│     • Atualiza status: "qualificado", "reuniao_agendada"    │
│                                                              │
│  🔹 Opção B: Automática (Filtros no Script)                 │
│     • Script filtra por:                                    │
│       - Origem (ex: só "landing_page_modal")               │
│       - Completude (tem email + telefone?)                  │
│       - Tempo (últimas 24h)                                 │
│       - Status (só "qualificado")                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. ENVIO PARA META (Script Automático)                     │
│                                                              │
│  Script roda a cada 15 minutos:                             │
│  ✓ Busca leads com enviado_meta_lead = false               │
│  ✓ Aplica filtros de qualificação                          │
│  ✓ Envia para Meta CAPI (evento "Lead")                    │
│  ✓ Marca enviado_meta_lead = true                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. META OTIMIZA (Algoritmo do Facebook)                    │
│                                                              │
│  Meta aprende com os leads enviados:                        │
│  • Identifica padrões (quem converte)                       │
│  • Busca pessoas similares                                  │
│  • Cria Lookalike Audiences                                 │
│  • Otimiza campanhas para Lead Quality                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Onde Tratar os Dados?

### ✅ RECOMENDAÇÃO: Tratar em 2 lugares

#### 1️⃣ **No Script (Filtros Automáticos)**

**O que filtrar:**
- ✅ Completude de dados (tem email? tem telefone?)
- ✅ Origem (ignora leads de teste)
- ✅ Tempo (últimas 24h = leads quentes)
- ✅ Deduplicação (não enviar 2x)

**Vantagem:** Automático, roda sozinho

**Exemplo de configuração:**
```javascript
filters: {
  requireEmail: true,        // Só com email
  requirePhone: true,        // Só com telefone
  origemFilter: [
    'landing_page_modal',
    'micro_landing_page'
  ],
  maxAgeHours: 48,          // Últimas 48h
}
```

---

#### 2️⃣ **No CRM/Manual (Qualificação Humana)**

**O que qualificar:**
- ✅ Lead respondeu no WhatsApp?
- ✅ Tem interesse real?
- ✅ Tem budget?
- ✅ Tomador de decisão?

**Como fazer:**

**Opção A: Atualizar direto no Supabase**

Após qualificar no WhatsApp/CRM:

```sql
-- Marcar como qualificado
UPDATE leads
SET status = 'qualificado'
WHERE id = 'xxx-xxx-xxx';
```

Depois o script envia apenas qualificados:

```javascript
filters: {
  statusFilter: ['qualificado', 'fechado']
}
```

**Opção B: Usar HubSpot + Zapier**

```
HubSpot → Zapier → Supabase

Quando: Deal atinge "Qualificado"
Ação: Atualiza status no Supabase
```

Depois script envia automaticamente.

---

## 📋 3 Estratégias Prontas

### 🎯 Estratégia 1: VOLUME (Fase Inicial)

**Objetivo:** Maximizar leads, aprender rápido

**Filtros:**
```javascript
filters: {
  requireEmail: true,
  requirePhone: false,
  statusFilter: [],         // TODOS
  origemFilter: [],         // TODAS
  maxAgeHours: null        // SEM LIMITE
}
```

**Quem recebe:** Todos que preencheram com email

**Quando usar:**
- Começando campanhas
- Precisa de volume para Meta aprender
- Ainda não sabe o que é lead bom

---

### 🎯 Estratégia 2: QUALIDADE (Recomendado)

**Objetivo:** Leads que realmente engajam

**Filtros:**
```javascript
filters: {
  requireEmail: true,
  requirePhone: true,
  statusFilter: ['qualificado', 'reuniao_agendada'],
  origemFilter: ['landing_page_modal'],
  maxAgeHours: 72
}
```

**Quem recebe:**
- ✅ Tem email E telefone
- ✅ Foi qualificado (você marcou manualmente)
- ✅ Veio da landing page (não teste)
- ✅ Últimas 72h (lead quente)

**Quando usar:**
- Já tem volume inicial
- Sabe diferenciar lead bom de ruim
- Quer lookalikes precisos

---

### 🎯 Estratégia 3: APENAS CLIENTES (Lookalike de Compradores)

**Objetivo:** Meta aprende com quem COMPROU

**Filtros:**
```javascript
filters: {
  requireEmail: true,
  requirePhone: true,
  statusFilter: ['fechado'],    // APENAS FECHADOS
  origemFilter: [],
  maxAgeHours: null
}
```

**Quem recebe:** Apenas clientes que fecharam negócio

**Quando usar:**
- Já tem clientes fechados
- Quer lookalike de compradores
- Focado em ROI máximo

---

## 🔄 Evolução no Tempo

### Mês 1-2: Volume
```
Estratégia 1 (TODOS os leads)
↓
Meta aprende: "quem preenche formulário"
↓
Lookalike: Pessoas que preenchem
```

### Mês 3-4: Qualidade
```
Estratégia 2 (Leads QUALIFICADOS)
↓
Meta aprende: "quem responde e agenda"
↓
Lookalike: Pessoas que engajam
```

### Mês 5+: Compradores
```
Estratégia 3 (Apenas CLIENTES)
↓
Meta aprende: "quem fecha negócio"
↓
Lookalike: Pessoas que compram
```

---

## 📊 Como Medir Sucesso

### Métricas no Supabase

```sql
-- Taxa de conversão por origem
SELECT
  origem,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'fechado') as fechados,
  ROUND((COUNT(*) FILTER (WHERE status = 'fechado')::numeric / COUNT(*)) * 100, 2) as taxa_conversao
FROM leads
WHERE enviado_meta_lead = true
GROUP BY origem
ORDER BY taxa_conversao DESC;
```

### Métricas no Meta

1. **Event Match Quality**
   - Meta Events Manager → Data Sources → Quality
   - Objetivo: **Boa** ou **Excelente**

2. **Custo por Lead**
   - Antes vs Depois de qualificar
   - Objetivo: Reduzir 30-50%

3. **Taxa de Conversão**
   - Lead → Cliente
   - Objetivo: Aumentar 50-100%

---

## 🛠️ Configuração Rápida

### Para agenciagtx.com.br (AGORA)

**Recomendação inicial:**

```javascript
// sync-leads-to-meta.js
filters: {
  onlyNotSent: true,
  requireEmail: true,         // ✅ Obrigatório
  requirePhone: true,         // ✅ Você já captura
  statusFilter: [],           // 📝 Todos por enquanto
  origemFilter: [
    'landing_page_modal'      // ✅ Ignora testes
  ],
  maxAgeHours: 48,           // ✅ Últimos 2 dias
  limit: 100
}
```

**Executar:**
```bash
# Teste primeiro
node scripts/sync-leads-to-meta.js  # dryRun: true

# Depois ativa
# muda dryRun: false
node scripts/sync-leads-to-meta.js

# Automatiza
pm2 start scripts/sync-leads-to-meta.js --cron "*/15 * * * *"
```

**Depois de 50+ leads enviados:**

Mude para estratégia 2 (qualidade):

```javascript
statusFilter: ['qualificado', 'reuniao_agendada', 'fechado']
```

---

## 🎓 Capacitação do Time

### Para Atendimento/Vendas

Após cada atendimento no WhatsApp, atualizar status no Supabase:

```sql
-- Lead respondeu mas não qualificou
UPDATE leads SET status = 'contatado' WHERE telefone = '11999999999';

-- Lead qualificou (tem budget, interesse)
UPDATE leads SET status = 'qualificado' WHERE telefone = '11999999999';

-- Lead agendou reunião
UPDATE leads SET status = 'reuniao_agendada' WHERE telefone = '11999999999';

-- Lead fechou
UPDATE leads SET status = 'fechado', valor_venda = 5000 WHERE telefone = '11999999999';
```

**Ou:** Fazer isso no HubSpot e sincronizar com Zapier.

---

## 🚀 Próximos Passos

1. ✅ **Configurar script com Estratégia 1 (Volume)**
2. ✅ **Rodar por 2 semanas, enviar todos os leads**
3. ✅ **Analisar: Qual origem converte melhor?**
4. ✅ **Mudar para Estratégia 2 (Qualidade)**
5. ✅ **Criar Lookalike 1% no Meta**
6. ✅ **Testar campanha para Lookalike vs Cold Traffic**
7. ✅ **Medir: CPL, Taxa de Conversão, ROI**

---

## ❓ FAQ

**P: Posso enviar o mesmo lead 2x para Meta?**
R: Não precisa. O script usa `event_id` único + marca `enviado_meta_lead = true`.

**P: E se eu quiser reenviar leads antigos?**
R: Rode SQL:
```sql
UPDATE leads SET enviado_meta_lead = false WHERE created_at > '2026-01-01';
```

**P: Posso enviar leads para Google Ads também?**
R: Sim! Copie o script e mude para Google Ads API.

**P: Zapier é melhor que script?**
R: Zapier é mais fácil, mas tem custo mensal e menos controle.

**P: Quanto tempo Meta leva para aprender?**
R: 50 eventos = Fase de aprendizado
500+ eventos = Otimização completa

---

**GTX Agency** - Data-Driven Marketing 📊
