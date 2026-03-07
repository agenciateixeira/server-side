# 🚀 GTX Server-Side Tracking

Sistema completo de rastreamento server-side para campanhas de tráfego pago com conversões via WhatsApp.

## 📁 Estrutura do Projeto

```
SERVER-SIDE/
├── config/              # Configurações e credenciais
│   ├── .env.example     # Template de variáveis de ambiente
│   └── config.js        # Arquivo de configuração
│
├── scripts/             # Scripts de automação
│   ├── meta-capi.js     # Envio de eventos para Meta CAPI
│   ├── monitor-leads.js # Monitora Supabase e envia Purchase
│   └── test-events.js   # Script para testar eventos
│
├── landing-page/        # Código da Landing Page
│   ├── tracking.js      # Script de captura de dados
│   └── whatsapp-redirect.html  # Página intermediária
│
├── templates/           # Templates reutilizáveis
│   ├── google-sheets-script.js
│   └── supabase-schema.sql
│
├── docs/                # Documentação
│   └── setup-guide.md
│
└── logs/                # Logs de execução
    └── .gitkeep
```

## ⚙️ Setup Inicial

### 1. Instalar dependências

```bash
cd "Documents/AGENCIA GTX./SERVER-SIDE"
npm init -y
npm install @supabase/supabase-js dotenv
```

### 2. Configurar credenciais

Copie o arquivo `.env.example` para `.env` e preencha com suas credenciais:

```bash
cp config/.env.example config/.env
```

### 3. Criar tabela no Supabase

Execute o SQL que está em `templates/supabase-schema.sql`

## 🎯 Como Usar

### Monitorar leads e enviar Purchase automaticamente

```bash
node scripts/monitor-leads.js
```

### Testar envio de eventos

```bash
node scripts/test-events.js
```

## 📚 Documentação Completa

Ver arquivo `GTX-SERVER-SIDE-TRACKING-V-FINAL.pdf` na raiz do projeto.

## 🔐 Segurança

- Nunca commite o arquivo `.env` no Git
- Use apenas `service_role` key no servidor
- Mantenha Access Tokens seguros

---

Desenvolvido por **GTX Agency** 🚀
