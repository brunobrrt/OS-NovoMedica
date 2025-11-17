# 🚀 Quick Start - Sistema OS com QR Code

## ⚡ Início Rápido (5 minutos)

### 1. Setup Automático
```bash
# Windows
setup.bat

# Linux/Mac
bash setup.sh
```

### 2. Iniciar API
```bash
cd api
npm run dev
```

### 3. Abrir Frontend
- Abra `os-dashboard.html` no navegador
- **Login:** admin@example.com / admin123

### 4. Demo Interativo
- Abra `demo-qr.html` para ver exemplos práticos

## 🎯 Funcionalidades Principais

| Feature | Descrição | Status |
|---------|-----------|--------|
| 👥 Gestão de Clientes | CRUD completo | ✅ |
| 📋 Lista de Atendimentos | Filtros + ordenação | ✅ |
| 📝 Ordens de Serviço | Fluxo completo | ✅ |
| 🔒 QR Code Seguro | HMAC + JWT | ✅ |
| ✍️ Assinatura Digital | Canvas HTML5 | ✅ |
| 🧪 Testes | Unit + E2E | ✅ |

## 📱 Fluxo QR Code

1. **Gerar:** `POST /api/qr/generate`
2. **Escanear:** Cliente usa QR Code
3. **Validar:** `POST /api/qr/validate`
4. **Processar:** Editar/Registrar cliente

## 🔧 APIs Principais

### Autenticação
```http
POST /api/auth/login
{ "email": "admin@example.com", "password": "admin123" }
```

### QR Code
```http
POST /api/qr/generate
Authorization: Bearer {token}
{ "clientId": "uuid", "action": "edit" }
```

### Atendimento
```http
POST /api/atendimentos
Authorization: Bearer {token}
{ "clientId": "uuid", "summary": "Reparo", "priority": "alta" }
```

### Ordem de Serviço
```http
POST /api/os
Authorization: Bearer {token}
{ "clientId": "uuid", "summary": "Troca tela", "technician": "João" }
```

## 🛠 Comandos Úteis

```bash
# Iniciar desenvolvimento
cd api && npm run dev

# Executar testes
cd api && npm test

# Ver logs
cd api && npm run logs

# Verificar dependências
cd api && npm audit
```

## 🔒 Segurança

- **QR Tokens:** HMAC SHA-256 + expiração 1h
- **API:** JWT authentication
- **Payloads:** Assinatura digital verificada
- **CORS:** Configurado para domínios específicos

## 📊 Monitoramento

### URLs Importantes
- API: `http://localhost:3000/api`
- Health: `http://localhost:3000/api/health`
- Docs: `README.md`

### Logs
```bash
# Localização
api/logs/app.log

# Níveis
error, warn, info, debug
```

## 🚨 Troubleshooting

### Problemas Comuns

**API não inicia:**
```bash
# Verificar porta em uso
netstat -ano | findstr :3000

# Matar processo
taskkill /PID {PID} /F
```

**QR Code inválido:**
- Verificar expiração do token
- Confirmar assinatura HMAC
- Validar formato base64

**Erro de CORS:**
- Configurar CORS_ORIGIN no .env
- Verificar domínio permitido

### Contatos de Suporte
- 📧 Email: suporte@exemplo.com
- 🐛 Issues: GitHub repository
- 📖 Docs: README.md completo

## 🔮 Próximos Passos

- [ ] Banco de dados real (PostgreSQL)
- [ ] Upload de arquivos (multer)
- [ ] Notificações push
- [ ] Dashboard analytics
- [ ] App mobile

---
*Gerado automaticamente - Última atualização: Janeiro 2025*