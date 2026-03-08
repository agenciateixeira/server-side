# 🎯 GTX - Conversões Personalizadas Meta

Guia completo de configuração de conversões personalizadas no Meta Ads Manager.

---

## 📋 Visão Geral

As conversões personalizadas permitem criar objetivos específicos para suas campanhas baseados nos eventos do Pixel.

**Link direto:**
https://business.facebook.com/events_manager2/list/pixel/611003988383118/custom_conversions

---

## ⚠️ EVENTOS PERSONALIZADOS CUSTOMIZADOS - FAZER DEPOIS

**Status:** 🔴 NÃO IMPLEMENTAR AGORA

Eventos 100% customizados (tipo `GTX_Lead_Budget_Alto`, `GTX_Cliente_Recorrente_MRR`, etc.) serão implementados em uma **FASE FUTURA** quando:

- ✅ Sistema básico estiver rodando
- ✅ Tivermos volume de dados (50+ eventos por tipo)
- ✅ Precisarmos de granularidade extra

**Por enquanto:** Foque apenas nas 3 conversões principais baseadas em eventos padrão da Meta.

---

## 🎯 Conversões a Criar

### **CONVERSÃO 1: GTX - Lead WhatsApp** ✅

**Quando usar:**
- Otimizar campanha para captura de leads
- Criar lookalike de quem preenche formulário
- Medir custo por lead

**Configuração:**

| Campo | Valor |
|-------|-------|
| **Nome** | `GTX - Lead WhatsApp` |
| **Descrição** | `Lead que preencheu formulário WhatsApp no site` |
| **Fonte de dados** | `GUILHERME TEIXEIRA` (seu pixel) |
| **Fonte da ação** | `Site` |
| **Evento** | `Lead` |
| **Categoria** | `Lead` |
| **Regras** | Tipo: `URL` <br> Filtro: `contém` <br> Valor: `agenciagtx.com.br` |

**OU regra mais específica:**

| Tipo | Parâmetro | Filtro | Valor |
|------|-----------|--------|-------|
| Parâmetro de evento | `content_name` | `contém` | `landing_page` |

---

### **CONVERSÃO 2: GTX - Lead Qualificado** ⏳

**Quando usar:**
- Otimizar campanha para leads de qualidade
- Criar lookalike de quem realmente engaja
- Medir taxa de qualificação

**Status:** ⚠️ Criar DEPOIS de ativar script `sync-qualified-to-meta.js`

**Configuração:**

| Campo | Valor |
|-------|-------|
| **Nome** | `GTX - Lead Qualificado` |
| **Descrição** | `Lead que foi qualificado pela equipe de vendas` |
| **Fonte de dados** | `GUILHERME TEIXEIRA` |
| **Fonte da ação** | `Site` |
| **Evento** | `SubmitApplication` |
| **Categoria** | `Lead` |
| **Regras** | Tipo: `URL` <br> Filtro: `contém` <br> Valor: `agenciagtx.com.br` |

**Pré-requisito:**
```bash
# Ativar script de qualified
pm2 start scripts/sync-qualified-to-meta.js --name "gtx-qualified" --cron "0 * * * *"
```

---

### **CONVERSÃO 3: GTX - Cliente Fechado** ⏳

**Quando usar:**
- Otimizar campanha para vendas
- Criar lookalike de compradores
- Medir ROAS (retorno sobre investimento)

**Status:** ⚠️ Criar DEPOIS de ativar script `sync-purchases-to-meta.js`

**Configuração:**

| Campo | Valor |
|-------|-------|
| **Nome** | `GTX - Cliente Fechado` |
| **Descrição** | `Cliente que fechou negócio e gerou receita` |
| **Fonte de dados** | `GUILHERME TEIXEIRA` |
| **Fonte da ação** | `Site` |
| **Evento** | `Purchase` |
| **Categoria** | `Compra` |
| **Regras** | Tipo: `URL` <br> Filtro: `contém` <br> Valor: `agenciagtx.com.br` |
| **Valor de conversão** | `Usar valor do evento` ✅ |

**Pré-requisito:**
```bash
# Ativar script de purchases
pm2 start scripts/sync-purchases-to-meta.js --name "gtx-purchases" --cron "0 */6 * * *"
```

---

## 🚀 Ordem de Implementação

### **Fase 1: AGORA (Hoje)** ✅

**1. Criar conversão: GTX - Lead WhatsApp**
- ✅ Evento "Lead" já está sendo enviado
- ✅ Pode criar a conversão personalizada agora
- ✅ Usar em campanhas imediatamente

---

### **Fase 2: Próxima Semana** ⏳

**2. Ativar script de qualified**

Quando tiver leads qualificados manualmente (via interface HTML):

```bash
cd "/Users/guilhermeteixeira/Documents/AGENCIA GTX./SERVER-SIDE"

# Testar primeiro
node scripts/sync-qualified-to-meta.js

# Se funcionar, automatizar
pm2 start scripts/sync-qualified-to-meta.js \
  --name "gtx-qualified" \
  --cron "0 * * * *"
```

**3. Criar conversão: GTX - Lead Qualificado**
- Aguardar evento `SubmitApplication` aparecer na Meta
- Criar conversão personalizada
- Usar em campanhas

---

### **Fase 3: Quando tiver vendas** ⏳

**4. Ativar script de purchases**

Quando fechar negócios e marcar como "fechado" na interface:

```bash
# Testar primeiro
node scripts/sync-purchases-to-meta.js

# Se funcionar, automatizar
pm2 start scripts/sync-purchases-to-meta.js \
  --name "gtx-purchases" \
  --cron "0 */6 * * *"
```

**5. Criar conversão: GTX - Cliente Fechado**
- Aguardar evento `Purchase` aparecer na Meta
- Criar conversão personalizada
- Usar em campanhas focadas em ROI

---

## 📊 Como Usar as Conversões em Campanhas

### **Campanha 1: Captura de Leads (Topo de Funil)**

**Objetivo:** Conversão

**Otimizar para:** `GTX - Lead WhatsApp`

**Público:**
- Cold traffic (interesse: marketing digital, agências)
- Lookalike 1% de "GTX - Lead WhatsApp"

**Resultado esperado:**
- CPL (Custo Por Lead): R$ 15 - R$ 50
- Volume alto de leads
- Taxa de qualificação: 20-30%

---

### **Campanha 2: Leads Qualificados (Meio de Funil)**

**Objetivo:** Conversão

**Otimizar para:** `GTX - Lead Qualificado`

**Público:**
- Lookalike 1% de "GTX - Lead Qualificado"
- Remarketing: visitou site mas não converteu
- Engagement: interagiu com anúncios

**Resultado esperado:**
- CPL Qualificado: R$ 80 - R$ 200
- Taxa de conversão Lead → Cliente: 40-60%
- ROI melhor que campanha 1

---

### **Campanha 3: Vendas (Fundo de Funil)**

**Objetivo:** Conversão

**Otimizar para:** `GTX - Cliente Fechado`

**Público:**
- Lookalike 1% de "GTX - Cliente Fechado"
- Lookalike de alto valor (valor_venda > R$ 5.000)
- Remarketing: leads qualificados que não fecharam

**Resultado esperado:**
- CPA (Custo Por Aquisição): R$ 300 - R$ 1.000
- ROAS (Return on Ad Spend): 3x - 10x
- Clientes de alta qualidade

---

## 🎯 Públicos Personalizados (Audiences)

### **Depois de criar as conversões, crie públicos:**

**Acesse:** https://business.facebook.com/adsmanager/audiences

---

### **Público 1: Leads - Últimos 180 dias**

```
Create Audience → Custom Audience → Website

Source: Website
Event: Lead (ou conversão "GTX - Lead WhatsApp")
Retention: 180 dias
Nome: "Leads - 180 dias"
```

**Usar para:**
- Remarketing
- Exclusão em campanhas de topo de funil

---

### **Público 2: Leads Qualificados - Últimos 90 dias**

```
Create Audience → Custom Audience → Website

Source: Website
Event: SubmitApplication (ou "GTX - Lead Qualificado")
Retention: 90 dias
Nome: "Leads Qualificados - 90 dias"
```

**Usar para:**
- Base para Lookalike de qualidade
- Exclusão em campanhas básicas

---

### **Público 3: Clientes - Todos**

```
Create Audience → Custom Audience → Website

Source: Website
Event: Purchase (ou "GTX - Cliente Fechado")
Retention: 365 dias
Nome: "Clientes - 365 dias"
```

**Usar para:**
- Base para Lookalike de compradores
- Campanhas de upsell/cross-sell
- Exclusão em aquisição

---

## 🔥 Lookalike Audiences

### **Lookalike 1: Leads (Volume)**

```
Create Audience → Lookalike Audience

Source: "Leads - 180 dias"
Location: Brasil
Size: 1% (mais similar)
Nome: "LAL 1% - Leads"
```

**Usar em:** Campanhas de volume (topo de funil)

---

### **Lookalike 2: Qualificados (Qualidade)**

```
Source: "Leads Qualificados - 90 dias"
Location: Brasil
Size: 1%
Nome: "LAL 1% - Qualificados"
```

**Usar em:** Campanhas de eficiência (meio de funil)

---

### **Lookalike 3: Clientes (ROAS)**

```
Source: "Clientes - 365 dias"
Location: Brasil
Size: 1%
Nome: "LAL 1% - Compradores"
```

**Usar em:** Campanhas focadas em ROI (fundo de funil)

---

### **Lookalike 4: Alto Valor (Premium)**

```
Source: "Clientes - 365 dias"
Filter: value > 5000 (se possível filtrar)
Location: Brasil
Size: 1%
Nome: "LAL 1% - Alto Valor"
```

**Usar em:** Campanhas premium (ticket alto)

---

## 📈 Análise de Performance

### **Métricas por Conversão:**

**GTX - Lead WhatsApp:**
- Custo por conversão
- Taxa de conversão (CTR → Lead)
- Volume de leads/dia
- Taxa de qualificação (Lead → Qualified)

**GTX - Lead Qualificado:**
- Custo por lead qualificado
- Taxa Lead → Qualificado
- Taxa Qualificado → Fechado
- Tempo médio até qualificar

**GTX - Cliente Fechado:**
- CPA (Custo Por Aquisição)
- ROAS (Receita / Investimento)
- Valor médio de venda
- LTV (Lifetime Value)

---

## 🔧 Troubleshooting

### **Conversão não está rastreando eventos**

**Causa:** Evento não está sendo enviado ou regra está errada

**Solução:**
1. Verifique se evento está chegando: Events Manager → Test Events
2. Revise regras da conversão (URL, parâmetros)
3. Aguarde até 24h para Meta processar

---

### **Conversão rastreando poucos eventos**

**Causa:** Regras muito restritivas

**Solução:**
1. Simplifique regra (use apenas URL)
2. Remova filtros de parâmetros desnecessários
3. Teste com regra mais ampla

---

### **Não consigo criar conversão para SubmitApplication**

**Causa:** Evento ainda não foi enviado

**Solução:**
1. Qualifique 1 lead manualmente na interface
2. Rode script: `node scripts/sync-qualified-to-meta.js`
3. Aguarde evento aparecer na Meta (15-30 min)
4. Crie conversão

---

## ✅ Checklist de Implementação

### **Fase 1 (Hoje)**
- [ ] Criar conversão: GTX - Lead WhatsApp
- [ ] Criar público: Leads - 180 dias
- [ ] Criar lookalike: LAL 1% - Leads
- [ ] Testar em campanha de teste

### **Fase 2 (Próxima Semana)**
- [ ] Ativar script sync-qualified-to-meta.js
- [ ] Qualificar 5+ leads manualmente
- [ ] Criar conversão: GTX - Lead Qualificado
- [ ] Criar público: Leads Qualificados
- [ ] Criar lookalike: LAL 1% - Qualificados

### **Fase 3 (Quando tiver vendas)**
- [ ] Ativar script sync-purchases-to-meta.js
- [ ] Fechar 3+ negócios
- [ ] Criar conversão: GTX - Cliente Fechado
- [ ] Criar público: Clientes
- [ ] Criar lookalike: LAL 1% - Compradores
- [ ] Criar campanha focada em ROAS

---

## 📞 Suporte

Dúvidas sobre conversões personalizadas?
- Central de Ajuda Meta: https://www.facebook.com/business/help/1151775458272917
- GTX Agency: contato@agenciagtx.com.br

---

**GTX Agency** - Conversões Personalizadas para Máxima Performance 🚀
