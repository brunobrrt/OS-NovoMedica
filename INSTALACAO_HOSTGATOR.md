# 🚀 Guia de Instalação no Hostgator - Sistema OS NovoMedica

## 📋 Pré-requisitos

- Conta no Hostgator com Node.js habilitado
- Acesso ao cPanel
- Banco de dados MySQL criado no cPanel
- Cliente FTP (FileZilla) ou acesso SSH

---

## 🗄️ Passo 1: Configurar Banco de Dados MySQL

### 1.1 Criar Banco de Dados no cPanel

1. Acesse o **cPanel** do Hostgator
2. Vá em **MySQL® Databases**
3. Crie um novo banco de dados:
   - Nome: `novomedica_os`
4. Crie um novo usuário MySQL:
   - Nome: `novomedica_user`
   - Senha: (senha forte - anote!)
5. Adicione o usuário ao banco de dados com **TODAS AS PERMISSÕES**

### 1.2 Anotar Credenciais

```
Host: localhost
Database: novomedica_os
Username: novomedica_user
Password: [sua senha]
```

---

## 📂 Passo 2: Upload dos Arquivos

### 2.1 Estrutura de Pastas no Servidor

```
public_html/
├── login.html (arquivo principal)
├── login.css
├── login.js
├── os-dashboard.html
├── os-dashboard.css
├── os-dashboard.js
├── usuarios.html
├── usuarios.js
├── (demais arquivos HTML/CSS/JS)
└── api/
    ├── server.js
    ├── database.js
    ├── auth.js
    └── package.json
```

### 2.2 Upload via FTP

1. Conecte-se via FileZilla ao Hostgator
2. Faça upload de TODOS os arquivos HTML, CSS e JS para `public_html/`
3. Faça upload da pasta `api/` completa para `public_html/api/`

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo `.env` em `/api/`

Crie o arquivo `public_html/api/.env`:

```env
# Banco de Dados
DB_HOST=localhost
DB_USER=novomedica_user
DB_PASSWORD=sua_senha_aqui
DB_NAME=novomedica_os

# Segurança
JWT_SECRET=chave-super-secreta-aleatoria-mude-aqui-123456
QR_SECRET=outra-chave-secreta-para-qr-code-987654

# Servidor
PORT=3000
NODE_ENV=production
```

**⚠️ IMPORTANTE**: Gere chaves secretas fortes para produção!

### 3.2 Criar arquivo `.htaccess` (Proteção)

Crie `public_html/api/.htaccess`:

```apache
# Proteger arquivo .env
<Files .env>
    Order allow,deny
    Deny from all
</Files>
```

---

## 🔧 Passo 4: Instalar Dependências Node.js

### 4.1 Via SSH (Recomendado)

```bash
cd public_html/api
npm install
```

### 4.2 Dependências Necessárias

Verifique se `api/package.json` tem:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mysql2": "^3.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1"
  }
}
```

Instale manualmente se necessário:

```bash
npm install express cors mysql2 bcryptjs jsonwebtoken dotenv
```

---

## 🚀 Passo 5: Iniciar Servidor Node.js

### 5.1 Via cPanel - Setup Node.js Application

1. No cPanel, vá em **Setup Node.js App**
2. Clique em **Create Application**
3. Configure:
   - **Node.js Version**: 14.x ou superior
   - **Application Mode**: Production
   - **Application Root**: `api`
   - **Application URL**: `api` ou `nodejs`
   - **Application Startup File**: `server.js`
4. Clique em **Create**

### 5.2 Testar API

Acesse: `https://seudominio.com/api/`

Deve retornar JSON com informações da API.

---

## 🔐 Passo 6: Criar Usuário Administrador

### 6.1 Via API (Primeira execução)

O servidor criará automaticamente o usuário admin na primeira execução:

```
Email: admin@novomedica.com
Senha: admin123
```

**⚠️ ALTERE A SENHA IMEDIATAMENTE!**

### 6.2 Via SQL Direto (alternativa)

No **phpMyAdmin** do cPanel, execute:

```sql
USE novomedica_os;

INSERT INTO users (name, email, password, role) 
VALUES (
    'Administrador', 
    'admin@novomedica.com',
    '$2a$10$exemplo.hash.bcrypt.aqui',  -- Use bcrypt para gerar
    'admin'
);
```

---

## 🌐 Passo 7: Configurar URLs de Produção

### 7.1 Atualizar `login.js`

Altere a linha:

```javascript
// ANTES (desenvolvimento)
this.API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// DEPOIS (produção Hostgator)
this.API_URL = '/api'; // ou 'https://seudominio.com/api'
```

### 7.2 Atualizar `os-dashboard.js`

```javascript
// ANTES
this.apiBaseUrl = 'http://localhost:3000/api';

// DEPOIS
this.apiBaseUrl = '/api'; // ou 'https://seudominio.com/api'
```

---

## 🔄 Passo 8: Migrar Dados do localStorage para MySQL

### 8.1 Exportar Dados do Navegador

No console do navegador (F12):

```javascript
// Exportar todos os dados
const dados = {
    clientes: localStorage.getItem('mockClients'),
    atendimentos: localStorage.getItem('mockAtendimentos'),
    ordens: localStorage.getItem('mockOrdens'),
    dispositivos: localStorage.getItem('mockDevices')
};

console.log(JSON.stringify(dados, null, 2));
// Copie o output
```

### 8.2 Script de Migração

Crie `api/migrate-data.js`:

```javascript
const db = require('./database');

async function migrateData(dados) {
    await db.init();
    
    // Importar clientes
    const clientes = JSON.parse(dados.clientes || '[]');
    for (const cliente of clientes) {
        await db.query(
            'INSERT INTO clients (name, phone, cpf_cnpj, email, address, qr_code) VALUES (?, ?, ?, ?, ?, ?)',
            [cliente.name, cliente.phone, cliente.cpfCnpj, cliente.email, cliente.address, cliente.qrCode]
        );
    }
    
    console.log('✅ Migração concluída!');
    process.exit(0);
}

// Cole os dados aqui
const dados = {
    /* Cole o JSON exportado */
};

migrateData(dados);
```

Execute:

```bash
node migrate-data.js
```

---

## ✅ Passo 9: Testar Sistema

### 9.1 Checklist de Testes

- [ ] Acesso a `https://seudominio.com/login.html`
- [ ] Login com admin@novomedica.com / admin123
- [ ] Redirecionamento para dashboard
- [ ] Criação de novo usuário em "Gerenciar Usuários"
- [ ] Logout funcionando
- [ ] APIs respondendo corretamente

### 9.2 Verificar Logs

No SSH:

```bash
cd public_html/api
pm2 logs
# ou
tail -f logs/error.log
```

---

## 🔒 Passo 10: Segurança Adicional

### 10.1 Forçar HTTPS

Crie/edite `public_html/.htaccess`:

```apache
# Forçar HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proteger login.html como página inicial
DirectoryIndex login.html
```

### 10.2 Proteger Arquivos Sensíveis

```apache
# Bloquear acesso a arquivos de configuração
<FilesMatch "^\.(?!well-known)">
    Require all denied
</FilesMatch>

<FilesMatch "\.(env|json|md)$">
    Require all denied
</FilesMatch>
```

---

## 📞 Suporte e Troubleshooting

### Problema: "Cannot connect to database"

**Solução**:
1. Verifique credenciais no `.env`
2. Confirme que usuário MySQL tem permissões
3. Teste conexão no phpMyAdmin

### Problema: "Token inválido"

**Solução**:
1. Limpe cache do navegador
2. Faça logout e login novamente
3. Verifique JWT_SECRET no `.env`

### Problema: API retorna 404

**Solução**:
1. Verifique se Node.js App está rodando no cPanel
2. Confirme que `server.js` está na pasta correta
3. Reinicie a aplicação Node.js

---

## 📝 Manutenção

### Backup Automático do Banco

Configure no cPanel:
1. Vá em **Backup**
2. Configure backup automático diário
3. Envie cópias para e-mail ou FTP externo

### Atualizar Sistema

```bash
cd public_html/api
git pull  # Se usar Git
npm install  # Atualizar dependências
pm2 restart all  # Reiniciar servidor
```

---

## 🎉 Sistema Pronto!

Seu sistema OS NovoMedica agora está:
- ✅ Rodando no Hostgator
- ✅ Usando banco MySQL
- ✅ Com autenticação segura
- ✅ Pronto para produção

**Credenciais padrão**:
- Admin: admin@novomedica.com / admin123
- **Altere a senha imediatamente!**

---

**Criado por**: Sistema OS NovoMedica
**Versão**: 1.0.0
**Data**: 2024
