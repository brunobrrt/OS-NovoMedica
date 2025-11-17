# 📦 Guia de Instalação - Sistema OS com QR Code

## Pré-requisitos

Antes de instalar o sistema, você precisa ter o **Node.js** instalado no seu computador.

### 🔽 Instalando o Node.js (Windows)

1. **Acesse o site oficial:**
   ```
   https://nodejs.org/
   ```

2. **Baixe a versão LTS (recomendada)**
   - Clique no botão verde "LTS" (Long Term Support)
   - Exemplo: Node.js 20.x.x LTS
   - O instalador é um arquivo `.msi` (aproximadamente 30-50 MB)

3. **Execute o instalador**
   - Abra o arquivo `.msi` baixado
   - Clique em "Next" → "Next" → "Next"
   - ✅ Marque a opção: "Automatically install the necessary tools"
   - Clique em "Install"
   - Aguarde a conclusão da instalação

4. **Reinicie o terminal**
   - **IMPORTANTE:** Feche todas as janelas do PowerShell/CMD
   - Abra uma nova janela do PowerShell ou CMD
   - Isso é necessário para que o Windows reconheça os comandos `node` e `npm`

5. **Verifique a instalação**
   ```powershell
   node --version
   npm --version
   ```
   
   Você deverá ver algo como:
   ```
   v20.10.0
   10.2.3
   ```

---

## 🚀 Instalação do Sistema OS

Depois de instalar o Node.js:

### ✅ Solução Rápida (Recomendado)

**Execute clicando duas vezes:**

1. **`install.bat`** - Instala todas as dependências
2. **`start-api.bat`** - Inicia o servidor da API

> Estes scripts usam os caminhos completos do Node.js e não exigem mudanças nas políticas do PowerShell.

### Opção 2: Usando o script automático

```powershell
cd C:\OS-Web
.\setup.bat
```

### Opção 3: Instalação manual

```powershell
# 1. Entre na pasta do projeto
cd C:\OS-Web

# 2. Entre na pasta da API
cd api

# 3. Instale as dependências usando o caminho completo
& "C:\Program Files\nodejs\npm.cmd" install

# 4. Copie o arquivo de configuração
copy .env.example .env

# 5. Inicie o servidor
& "C:\Program Files\nodejs\node.exe" server.js
```

---

## ▶️ Iniciando o Sistema

### 1. Iniciar a API (Backend)

```powershell
cd C:\OS-Web\api
npm run dev
```

A API estará rodando em: `http://localhost:3000`

### 2. Abrir o Frontend

Abra um dos seguintes arquivos no navegador:

- **Dashboard Principal:** `os-dashboard.html`
- **Demonstração QR Code:** `demo-qr.html`

---

## 🧪 Executando Testes

```powershell
cd C:\OS-Web\api
npm test
```

---

## ❓ Problemas Comuns

### "npm não é reconhecido como comando"

**Solução:**

1. Certifique-se de que o Node.js foi instalado corretamente
2. **Feche e reabra o terminal** (PowerShell/CMD)
3. Verifique com: `node --version` e `npm --version`

### "A execução de scripts foi desabilitada neste sistema" (PowerShell)

**Problema:** 
```
npm : O arquivo C:\Program Files\nodejs\npm.ps1 não pode ser carregado porque 
a execução de scripts foi desabilitada neste sistema.
```

**Solução Rápida - Use o CMD em vez do PowerShell:**

1. Pressione `Win + R`
2. Digite: `cmd`
3. Pressione Enter
4. Execute os comandos normalmente:
   ```cmd
   cd C:\OS-Web\api
   npm install
   npm run dev
   ```

**Solução Alternativa - Liberar PowerShell (Requer Administrador):**

1. Abra o PowerShell **como Administrador**
   - Clique com botão direito no menu Iniciar
   - Selecione "Windows PowerShell (Admin)" ou "Terminal (Admin)"

2. Execute o comando:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. Digite `S` e pressione Enter para confirmar

4. Feche e abra um novo PowerShell normal

5. Agora o npm deve funcionar:
   ```powershell
   npm --version
   ```

### "EACCES: permission denied"

**Solução (Windows):**
```powershell
# Execute o PowerShell como Administrador
cd C:\OS-Web\api
npm install
```

### "Cannot find module 'express'"

**Solução:**
```powershell
cd C:\OS-Web\api
npm install
```

### A API não inicia

**Verifique:**
1. Se a porta 3000 já está em uso
2. Se todas as dependências foram instaladas
3. Se o arquivo `.env` existe na pasta `api`

---

## 📞 Suporte

Caso encontre problemas, verifique:

1. ✅ Node.js versão 18 ou superior instalado
2. ✅ npm versão 9 ou superior instalado
3. ✅ Terminal reiniciado após instalar Node.js
4. ✅ Pasta `node_modules` criada dentro de `api/`
5. ✅ Arquivo `.env` existe dentro de `api/`

---

## 📚 Próximos Passos

Após a instalação bem-sucedida:

1. Leia o `README.md` para documentação completa
2. Leia o `QUICK_START.md` para referência rápida
3. Abra `demo-qr.html` para ver exemplos interativos
4. Configure o arquivo `.env` com suas credenciais

---

**Desenvolvido para OS-Web System** 🚀
