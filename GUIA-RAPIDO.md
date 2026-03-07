# 🚀 GTX Server-Side Tracking - Guia Rápido

## ✅ Setup Completo em 5 Passos

### 1️⃣ Criar tabela no Supabase

Acesse https://supabase.com/dashboard e execute o SQL:

```bash
# Copie o arquivo:
templates/supabase-schema.sql

# Execute no SQL Editor do Supabase
```

### 2️⃣ Testar conexão e eventos

```bash
cd "Documents/AGENCIA GTX./SERVER-SIDE"
node scripts/test-events.js
```

Você deve ver:
- ✅ Conexão com Supabase OK
- ✅ Lead inserido com sucesso
- ✅ Evento CAPI enviado com sucesso

### 3️⃣ Verificar eventos no Meta

1. Acesse: https://business.facebook.com/events_manager2
2. Selecione seu Pixel (ID: 611003988383118)
3. Clique em **Test Events** no menu lateral
4. Você deve ver os eventos de teste aparecendo

### 4️⃣ Instalar código na Landing Page

**Opção A: HTML Puro**
```html
<!-- Antes do </body> -->
<script src="https://seu-site.com/tracking.js"></script>
```

**Opção B: Inline (copiar tracking.js para dentro do HTML)**

**Importante:**
- Adicione `class="whatsapp-button"` nos links de WhatsApp
- OU o script detecta automaticamente `href*="wa.me"` ou `href*="api.whatsapp.com"`

### 5️⃣ Iniciar monitoramento automático

```bash
# Terminal 1 - Deixa rodando
node scripts/monitor-leads.js
```

O script vai:
- ✅ Verificar Supabase a cada 5 minutos
- ✅ Detectar leads com `status = "fechado"`
- ✅ Enviar evento `Purchase` via CAPI automaticamente
- ✅ Marcar como enviado para não duplicar

---

## 📋 Fluxo Operacional

### Quando lead chega:

1. **Lead clica no botão WhatsApp** → Dados salvos no Supabase automaticamente
2. **Você atende no WhatsApp** → Qualifica o lead
3. **Lead fecha compra** → Você atualiza no Supabase:
   ```sql
   UPDATE leads
   SET status = 'fechado', valor_venda = 199.90
   WHERE id = 'xxx';
   ```
4. **Script detecta e envia Purchase** → Meta recebe conversão real
5. **Algoritmo aprende** → Otimiza para trazer mais compradores

---

## 🔧 Comandos Úteis

### Rodar testes
```bash
npm test
# ou
node scripts/test-events.js
```

### Iniciar monitor
```bash
npm start
# ou
node scripts/monitor-leads.js
```

### Testar CAPI manualmente
```bash
node scripts/meta-capi.js
```

### Ver estrutura do projeto
```bash
ls -la
```

---

## 📊 Verificar se está funcionando

### 1. Supabase
- Acesse: https://cffpqwynoftzqpdkaqoj.supabase.co
- Vá em **Table Editor → leads**
- Deve aparecer leads capturados

### 2. Meta Events Manager
- Acesse: https://business.facebook.com/events_manager2
- Selecione Pixel ID: 611003988383118
- Vá em **Overview** → Deve mostrar eventos recebidos
- Verifique **Event Match Quality** → Deve estar 8+

### 3. Campanhas
- Após 50 conversões/semana → Sai do modo aprendizagem
- CPL deve cair 30-50%
- Taxa de conversão deve subir

---

## ⚠️ Troubleshooting

### Eventos não aparecem no Meta
- Verifique `META_ACCESS_TOKEN` no `.env`
- Use Test Events Tool para debugar
- Confirme que `META_PIXEL_ID` está correto

### Lead não salva no Supabase
- Verifique RLS policies (tabela deve permitir INSERT público)
- Confirme URL e anon_key no `tracking.js`
- Abra console do navegador (F12) para ver erros

### Monitor não envia Purchase
- Verifique se script está rodando: `ps aux | grep node`
- Confirme que `status = 'fechado'` no Supabase
- Veja logs do script

---

## 🎯 Métricas para Acompanhar

| Métrica | Meta | Como verificar |
|---------|------|----------------|
| Event Match Quality | 8-10 | Meta Events Manager → Overview |
| CPL | R$ 5-20 | Gerenciador de Anúncios |
| Taxa conversão Lead→Venda | 20-40% | Supabase (leads fechados / total) |
| Conversões/semana | 50+ | Meta Ads → Relatórios |

---

## 📚 Documentação Completa

Ver arquivo: `GTX-SERVER-SIDE-TRACKING-V-FINAL.pdf`

---

## 🆘 Suporte

Problemas? Verifique:
1. Logs do script de monitoramento
2. Console do navegador (F12)
3. Test Events no Meta
4. Dados no Supabase

---

Desenvolvido por **GTX Agency** 🚀
