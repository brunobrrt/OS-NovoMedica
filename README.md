# Sistema de Ordem de Serviço (OS) com QR Code

Um sistema completo para gestão de ordens de serviço com funcionalidade de QR Code para identificação e validação de clientes.

## 🚀 Funcionalidades

### 📋 Gestão de Atendimentos
- **Lista de Atendimentos** com filtros por status e ordenação por prioridade/data
- **Colunas**: ID, Cliente, Telefone, Serviço, Prioridade, Data Criação, Ações
- **Ações**: Editar, Abrir OS, Gerar QR Code
- **Status**: Aguardando, Em Atendimento

### 📝 Gestão de Ordens de Serviço
- **OS Pendentes**: Aguardando execução
- **OS Assinadas**: Com assinatura do cliente
- **OS Finalizadas**: Trabalhos concluídos
- **Fluxo**: Pendente → Assinada → Finalizada
- **Funcionalidades**: Visualizar, Editar, Assinar, Finalizar

### 🔒 Sistema QR Code Seguro
- **Geração** de QR Codes com payload assinado (HMAC)
- **Validação** com verificação de assinatura e expiração
- **Payload** contém: `clientId`, `action` (edit/register), `exp`, `iat`
- **Segurança**: Token JWT com expiração de 1 hora

### 👥 Gestão de Clientes
- **CRUD completo** para clientes
- **Campos**: ID, Nome, Telefone, Email, Endereço
- **Integração** com QR Code para edição rápida

## 🛠 Tecnologias

### Backend
- **Node.js** + Express.js
- **JWT** para autenticação
- **HMAC SHA-256** para assinatura de QR Codes
- **CORS** habilitado
- **Memory Storage** (mock para desenvolvimento)

### Frontend
- **HTML5** + CSS3 + JavaScript (Vanilla)
- **Responsive Design**
- **Canvas API** para captura de assinatura
- **QR Code Library** para geração de códigos
- **Fetch API** para comunicação com backend

## 📁 Estrutura do Projeto

```
OS-Web/
├── api/                          # Backend Node.js
│   ├── server.js                 # Servidor principal
│   ├── package.json             # Dependências
│   ├── .env.example             # Configurações de ambiente
│   └── tests/
│       └── os-system.test.js    # Testes unitários e E2E
├── os-dashboard.html            # Dashboard principal
├── os-dashboard.css             # Estilos do dashboard
├── os-dashboard.js              # JavaScript principal
├── qr-utils.js                  # Utilitários QR Code e API
└── README.md                    # Esta documentação
```

## 🔧 Instalação e Configuração

### 1. Configurar Backend

```bash
cd api
npm install
cp .env.example .env
```

**Editar `.env` com suas configurações:**
```env
PORT=3000
JWT_SECRET=sua-chave-jwt-super-secreta
QR_SECRET=sua-chave-qr-super-secreta
```

### 2. Iniciar Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### 3. Executar Testes

```bash
npm test
```

### 4. Acessar Frontend

Abra `os-dashboard.html` em seu navegador ou sirva através de um servidor web.

## 📱 Usando QR Codes

### Gerar QR Code
1. No dashboard, clique em "QR" ao lado de um atendimento
2. Uma nova janela abrirá com o QR Code visual
3. O token também é exibido para cópia manual

### Processar QR Code
1. Clique em "Processar QR" no dashboard
2. Cole o token do QR Code no campo
3. Clique em "Processar QR Code"
4. Se válido, opções de editar/registrar cliente aparecerão

### Exemplos de Payload

**QR Code Válido (Editar Cliente):**
```json
{
  "payload": {
    "clientId": "123e4567-e89b-12d3-a456-426614174000",
    "action": "edit",
    "exp": 1736694000,
    "iat": 1736690400
  },
  "signature": "assinatura-hmac-sha256"
}
```

**QR Code para Registro:**
```json
{
  "payload": {
    "clientId": "new-client-id",
    "action": "register",
    "exp": 1736694000,
    "iat": 1736690400
  },
  "signature": "assinatura-hmac-sha256"
}
```

## 🔌 API Endpoints

### Autenticação
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### Atendimentos
```http
# Listar atendimentos
GET /api/atendimentos?status=aguardando&sortBy=priority&page=1

# Criar atendimento
POST /api/atendimentos
Authorization: Bearer {token}

{
  "clientId": "uuid",
  "summary": "Reparo de smartphone",
  "priority": "alta",
  "status": "aguardando"
}

# Atualizar atendimento
PUT /api/atendimentos/{id}
Authorization: Bearer {token}

# Deletar atendimento
DELETE /api/atendimentos/{id}
Authorization: Bearer {token}
```

### Ordens de Serviço
```http
# Listar OS por status
GET /api/os?status=pending

# Criar OS
POST /api/os
Authorization: Bearer {token}

{
  "clientId": "uuid",
  "summary": "Troca de tela iPhone",
  "technician": "Carlos Técnico"
}

# Assinar OS
PATCH /api/os/{id}/sign
Authorization: Bearer {token}

{
  "signatureUrl": "signature_123.png"
}

# Finalizar OS
PATCH /api/os/{id}/finalize
Authorization: Bearer {token}
```

### QR Codes
```http
# Gerar QR Code
POST /api/qr/generate
Authorization: Bearer {token}

{
  "clientId": "uuid",
  "action": "edit"
}

# Validar QR Code
POST /api/qr/validate
Authorization: Bearer {token}

{
  "token": "base64-encoded-signed-payload"
}
```

### Clientes
```http
# Listar clientes
GET /api/clients
Authorization: Bearer {token}

# Buscar cliente
GET /api/clients/{id}
Authorization: Bearer {token}

# Criar cliente
POST /api/clients
Authorization: Bearer {token}

{
  "name": "João Silva",
  "phone": "11999999999",
  "email": "joao@email.com",
  "address": "Rua das Flores, 123"
}

# Atualizar cliente
PUT /api/clients/{id}
Authorization: Bearer {token}
```

## 🧪 Executando Testes

O sistema inclui testes abrangentes:

```bash
# Executar todos os testes
npm test

# Executar com watch mode
npm run test:watch

# Executar testes específicos
npm test -- --grep "QR Code"
```

### Cobertura de Testes
- ✅ Autenticação JWT
- ✅ CRUD de Clientes
- ✅ CRUD de Atendimentos  
- ✅ CRUD de Ordens de Serviço
- ✅ Geração e validação de QR Codes
- ✅ Fluxo completo E2E: Atendimento → OS → Assinatura → Finalização
- ✅ Validação de segurança (tokens expirados, assinaturas inválidas)

## 🔒 Segurança

### QR Code Security
- **HMAC SHA-256** para assinatura de payloads
- **Expiração automática** dos tokens (1 hora)
- **Verificação de timestamp** (`iat` e `exp`)
- **Validação de integridade** com `crypto.timingSafeEqual`

### API Security
- **JWT** para autenticação de endpoints
- **CORS** configurado para domínios específicos
- **Validação de entrada** em todos os endpoints
- **Sanitização** de dados de entrada

### Exemplo de Token Expirado
```json
{
  "error": "Token expirado",
  "code": 401
}
```

### Exemplo de Assinatura Inválida
```json
{
  "error": "Token inválido - assinatura não confere",
  "code": 401
}
```

## 🚀 Deploy

### Desenvolvimento Local
1. Clone o repositório
2. Configure `.env` com suas chaves
3. Execute `npm install` e `npm run dev`
4. Abra `os-dashboard.html` em um servidor local

### Produção
1. Configure variáveis de ambiente de produção
2. Use um banco de dados real (PostgreSQL/MongoDB)
3. Configure HTTPS
4. Use um reverse proxy (nginx)
5. Configure logs e monitoramento

### Variáveis de Ambiente Críticas
```env
NODE_ENV=production
JWT_SECRET=super-secret-production-key
QR_SECRET=qr-production-signing-key
DB_CONNECTION_STRING=postgresql://user:pass@host:port/db
CORS_ORIGIN=https://yourdomain.com
```

## 📊 Monitoramento

### Logs
- Logs estruturados em JSON
- Níveis: `error`, `warn`, `info`, `debug`
- Arquivo de log configurável

### Métricas
- Contadores de requests por endpoint
- Tempo de resposta médio
- Taxa de erro de validação QR
- Estatísticas de uso por cliente

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 🐛 Problemas Conhecidos

- Dados são armazenados em memória (development only)
- Assinatura digital simplificada (melhorar para produção)
- Cache de QR codes não implementado

## 🔮 Roadmap

- [ ] Integração com banco de dados real
- [ ] Upload real de arquivos de assinatura
- [ ] Notificações push
- [ ] Dashboard de analytics
- [ ] API de relatórios
- [ ] Integração com sistemas externos
- [ ] App mobile para técnicos

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os testes para exemplos
3. Abra uma issue no repositório