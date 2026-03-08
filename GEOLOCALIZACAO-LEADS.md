# 🌍 GTX - Geolocalização de Leads

Sistema de captura automática de país, estado e cidade baseado no IP do usuário.

---

## 📊 Visão Geral

Cada vez que um lead preenche o formulário, o sistema automaticamente:

1. **Captura o IP** do usuário
2. **Busca a geolocalização** usando ip-api.com (free, sem cadastro)
3. **Salva no Supabase:**
   - País (ex: "Brazil")
   - Código do país (ex: "BR")
   - Estado (ex: "São Paulo")
   - Código do estado (ex: "SP")
   - Cidade (ex: "São Paulo")

---

## 🎯 Para Que Serve?

### **1. Análise Estratégica de Investimento em Ads**

Descubra ONDE seus melhores leads vêm:

```sql
-- Quais cidades geram mais leads qualificados?
SELECT
  cidade,
  estado,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'qualificado') as qualificados,
  COUNT(*) FILTER (WHERE status = 'fechado') as vendas
FROM leads
WHERE cidade IS NOT NULL
GROUP BY cidade, estado
ORDER BY vendas DESC, qualificados DESC
LIMIT 10;
```

**Resultado:** Você descobre que São Paulo gera 60% das vendas → Aumenta o orçamento de ads para SP.

---

### **2. Segmentação Geográfica nas Campanhas**

**Campanha 1: SP Capital (Alto ROI)**
- Budget: R$ 5.000/mês
- Público: São Paulo - SP (cidade)
- Motivo: 70% das conversões vêm de lá

**Campanha 2: Interior SP**
- Budget: R$ 2.000/mês
- Público: Estado SP (exceto capital)
- Motivo: Taxa de conversão 30% menor

**Campanha 3: Outros Estados**
- Budget: R$ 1.000/mês
- Público: Resto do Brasil
- Motivo: Teste de expansão

---

### **3. Otimização de Custo por Lead (CPL)**

```sql
-- CPL por cidade (assumindo que você registra custo por campanha)
SELECT
  l.cidade,
  l.estado,
  COUNT(*) as total_leads,
  SUM(c.custo) as investimento_total,
  ROUND(SUM(c.custo) / COUNT(*), 2) as cpl
FROM leads l
LEFT JOIN campanhas c ON l.utm_campaign = c.nome_campanha
WHERE l.cidade IS NOT NULL
GROUP BY l.cidade, l.estado
ORDER BY cpl ASC;
```

**Insight:** Leads de Curitiba custam R$ 25, leads de RJ custam R$ 80 → Foco em Curitiba.

---

### **4. Criar Públicos Personalizados por Região**

No Meta Ads Manager:

**Público 1: Leads SP Capital**
```
Custom Audience → Customer List
Upload leads com cidade = "São Paulo"
Criar Lookalike 1% SP Capital
```

**Público 2: Leads Sul do Brasil**
```
Upload leads com estado IN ("Paraná", "Santa Catarina", "Rio Grande do Sul")
Criar Lookalike 1% Região Sul
```

---

## 🚀 Como Implementar

### **Passo 1: Executar SQL no Supabase**

```bash
# Abrir Supabase SQL Editor
# https://supabase.com/dashboard/project/cffpqwynoftzqpdkaqoj/editor

# Copiar e executar o conteúdo de:
add-geolocation-columns.sql
```

**Resultado esperado:**
```
ALTER TABLE
CREATE INDEX (3x)
```

---

### **Passo 2: Deploy da Landing Page**

O código já está atualizado em `trackingServerSide.js`.

**Se usar Vercel:**
```bash
cd /Users/guilhermeteixeira/Documents/PROJETOS/gtx-landing

# Commit das mudanças
git add .
git commit -m "feat: adicionar geolocalização automática de leads"

# Deploy
git push origin main
```

Vercel vai detectar e fazer deploy automático.

---

### **Passo 3: Testar**

1. Acesse sua landing page
2. Preencha o formulário WhatsApp
3. Vá no Supabase → Table Editor → leads
4. Veja o último lead criado

**Colunas esperadas:**
```
pais: Brazil
pais_codigo: BR
estado: São Paulo
estado_codigo: SP
cidade: São Paulo
```

---

## 📊 Queries Úteis

### **Top 10 Cidades com Mais Leads**

```sql
SELECT
  cidade,
  estado,
  COUNT(*) as total_leads
FROM leads
WHERE cidade IS NOT NULL
GROUP BY cidade, estado
ORDER BY total_leads DESC
LIMIT 10;
```

---

### **Distribuição por Estado**

```sql
SELECT
  estado,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'qualificado') as qualificados,
  COUNT(*) FILTER (WHERE status = 'fechado') as vendas,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'fechado')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as taxa_conversao_percent
FROM leads
WHERE estado IS NOT NULL
GROUP BY estado
ORDER BY total_leads DESC;
```

**Resultado:**
```
estado       | total_leads | qualificados | vendas | taxa_conversao
-------------|-------------|--------------|--------|---------------
São Paulo    | 150         | 45           | 12     | 8.00%
Rio de Janeiro| 80         | 20           | 4      | 5.00%
Minas Gerais | 60          | 15           | 2      | 3.33%
```

**Insight:** SP tem melhor taxa de conversão → Investir mais.

---

### **Leads por Cidade (Com Valor de Venda)**

```sql
SELECT
  cidade,
  estado,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'fechado') as vendas,
  SUM(valor_venda) as receita_total,
  ROUND(AVG(valor_venda), 2) as ticket_medio
FROM leads
WHERE cidade IS NOT NULL
  AND status = 'fechado'
GROUP BY cidade, estado
ORDER BY receita_total DESC;
```

**Resultado:**
```
cidade       | estado     | vendas | receita_total | ticket_medio
-------------|------------|--------|---------------|-------------
São Paulo    | São Paulo  | 12     | R$ 60.000     | R$ 5.000
Curitiba     | Paraná     | 5      | R$ 35.000     | R$ 7.000
Rio de Janeiro| Rio de Janeiro| 4 | R$ 20.000     | R$ 5.000
```

**Insight:** Curitiba tem ticket médio MAIOR → Vale a pena investir.

---

### **Heatmap: Quais Regiões Convertem Melhor?**

```sql
SELECT
  estado,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'fechado') as vendas,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'fechado')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as taxa_conversao,
  SUM(valor_venda) as receita_total
FROM leads
WHERE estado IS NOT NULL
GROUP BY estado
ORDER BY taxa_conversao DESC;
```

---

## 🎯 Estratégias de Uso

### **Estratégia 1: Dobrar o Budget nas Melhores Cidades**

**Análise:**
```sql
-- Ver top 5 cidades com melhor ROI
SELECT
  cidade,
  COUNT(*) as leads,
  SUM(valor_venda) as receita,
  SUM(valor_venda) / COUNT(*) as receita_por_lead
FROM leads
WHERE status = 'fechado'
  AND cidade IS NOT NULL
GROUP BY cidade
ORDER BY receita_por_lead DESC
LIMIT 5;
```

**Ação:**
- Criar campanha focada nas top 5 cidades
- Aumentar lance (bid) nessas regiões
- Criar anúncios localizados ("Agência em São Paulo")

---

### **Estratégia 2: Pausar Regiões com CPL Alto**

**Análise:**
```sql
-- Ver estados com muitos leads mas poucas vendas
SELECT
  estado,
  COUNT(*) as leads,
  COUNT(*) FILTER (WHERE status = 'fechado') as vendas,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'fechado')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as taxa_conversao
FROM leads
WHERE estado IS NOT NULL
GROUP BY estado
HAVING COUNT(*) > 10
ORDER BY taxa_conversao ASC;
```

**Ação:**
- Pausar campanhas em estados com conversão < 3%
- Ou: reduzir lance (bid) em 50%

---

### **Estratégia 3: Criar Lookalike Regionais**

**1. Exportar leads de SP:**
```sql
SELECT
  email,
  nome,
  telefone,
  cidade,
  estado
FROM leads
WHERE estado = 'São Paulo'
  AND status = 'fechado';
```

**2. Criar público no Meta:**
- Meta Ads Manager → Audiences
- Custom Audience → Customer List
- Upload CSV com leads de SP
- Create Lookalike 1% (location: São Paulo)

**3. Criar campanha:**
- Objetivo: Conversão
- Público: Lookalike SP 1%
- Budget: R$ 3.000/mês
- Resultado esperado: Leads similares aos compradores de SP

---

## 🔧 Troubleshooting

### **Geolocalização está NULL**

**Causa:** IP não foi capturado ou API falhou

**Solução:**
```sql
-- Ver quantos leads têm geolocalização
SELECT
  COUNT(*) as total,
  COUNT(pais) as com_geolocalizacao,
  COUNT(*) - COUNT(pais) as sem_geolocalizacao
FROM leads;
```

Se muitos estão sem geolocalização:
1. Verificar se ip-api.com está online
2. Verificar rate limit (45 req/min)
3. Ver logs do navegador (F12 → Console)

---

### **API retorna país errado**

**Causa:** IP de VPN ou proxy

**Solução:** Nada a fazer. Usuário usando VPN.

**Mitigação:** Analisar apenas leads com geolocalização presente.

---

### **Como testar localmente?**

```bash
# Testar a API de geolocalização
curl "http://ip-api.com/json/8.8.8.8?fields=status,country,regionName,city,countryCode,region"

# Resultado esperado:
{
  "status": "success",
  "country": "United States",
  "countryCode": "US",
  "region": "CA",
  "regionName": "California",
  "city": "Mountain View"
}
```

---

## 📈 KPIs Importantes

### **1. Distribuição Geográfica**

**Métrica:** % de leads por região

**Query:**
```sql
SELECT
  estado,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM leads
WHERE estado IS NOT NULL
GROUP BY estado
ORDER BY total DESC;
```

---

### **2. Taxa de Conversão por Região**

**Métrica:** % de leads que viram vendas

**Query:**
```sql
SELECT
  estado,
  COUNT(*) as leads,
  COUNT(*) FILTER (WHERE status = 'fechado') as vendas,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'fechado')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as taxa_conversao
FROM leads
WHERE estado IS NOT NULL
GROUP BY estado
ORDER BY taxa_conversao DESC;
```

---

### **3. Receita por Região**

**Métrica:** Quanto cada região gera de receita

**Query:**
```sql
SELECT
  estado,
  COUNT(*) FILTER (WHERE status = 'fechado') as vendas,
  SUM(valor_venda) as receita_total,
  ROUND(AVG(valor_venda), 2) as ticket_medio
FROM leads
WHERE estado IS NOT NULL
  AND status = 'fechado'
GROUP BY estado
ORDER BY receita_total DESC;
```

---

## 🎯 Próximos Passos

1. ✅ **Rodar por 2 semanas coletando dados geográficos**
2. ✅ **Analisar: Quais cidades/estados têm melhor ROI?**
3. ✅ **Criar campanhas segmentadas por região**
4. ✅ **Criar lookalikes regionais**
5. ✅ **Comparar performance regional**
6. ✅ **Escalar regiões que funcionam**

---

## ⚙️ Informações Técnicas

### **API Utilizada**

**Serviço:** ip-api.com
**Plano:** Free (sem cadastro)
**Limite:** 45 requisições/minuto
**Documentação:** http://ip-api.com/docs/

**Campos retornados:**
- `status`: "success" ou "fail"
- `country`: Nome do país (ex: "Brazil")
- `countryCode`: Código ISO (ex: "BR")
- `region`: Código do estado (ex: "SP")
- `regionName`: Nome do estado (ex: "São Paulo")
- `city`: Nome da cidade (ex: "São Paulo")

---

### **Privacidade**

**O IP é armazenado?** Sim, na coluna `ip_address`

**Isso é LGPD compliant?** Sim, desde que:
- Tenha política de privacidade informando
- Use dados apenas para análise interna
- Não compartilhe com terceiros

**Recomendação:** Adicionar na política de privacidade:

> "Coletamos seu endereço IP para análise geográfica e melhoria de nossos serviços. Seus dados são protegidos e não compartilhados com terceiros."

---

## 📞 Suporte

Dúvidas sobre geolocalização?
- GTX Agency: contato@agenciagtx.com.br

---

**GTX Agency** - Marketing Data-Driven com Inteligência Geográfica 🌍
