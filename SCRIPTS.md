# 🚀 Scripts de Gerenciamento - Sistema OS

## 📦 Scripts Disponíveis

### 1️⃣ `install.bat` - Instalação Inicial
**Execute este script PRIMEIRO para instalar todas as dependências.**

```
Clique duas vezes em: install.bat
```

**O que faz:**
- ✅ Verifica se Node.js está instalado
- ✅ Instala todas as dependências do npm (410 pacotes)
- ✅ Cria arquivo `.env` automaticamente
- ✅ Mostra instruções de uso
- ❌ Não fecha sozinho - mostra erros detalhados

**Tempo estimado:** 2-3 minutos

---

### 2️⃣ `start-api.bat` - Iniciar Servidor
**Execute para iniciar a API do sistema.**

```
Clique duas vezes em: start-api.bat
```

**O que faz:**
- ✅ Verifica dependências instaladas
- ✅ Detecta se porta 3000 já está em uso
- ✅ Inicia servidor Node.js
- ✅ Mostra URL da API e credenciais

**API estará em:** `http://localhost:3000`

**Para parar:** Pressione `CTRL+C` na janela do terminal

---

### 3️⃣ `stop-api.bat` - Parar Servidor
**Execute para parar o servidor que está rodando.**

```
Clique duas vezes em: stop-api.bat
```

**O que faz:**
- ✅ Procura processo usando porta 3000
- ✅ Pergunta confirmação antes de parar
- ✅ Encerra servidor de forma segura

---

### 4️⃣ `fix-npm.bat` - Corrigir PowerShell (Opcional)
**Execute como ADMINISTRADOR se quiser usar npm no PowerShell.**

```
Botão direito → Executar como Administrador
```

**O que faz:**
- ✅ Libera execução de scripts no PowerShell
- ✅ Permite usar comandos npm diretamente
- ⚠️ Requer permissões de administrador

---

## 🎯 Fluxo de Uso

### Primeira Vez:
1. **Instalar:** `install.bat`
2. **Iniciar:** `start-api.bat`
3. **Abrir:** `os-dashboard.html` no navegador

### Uso Diário:
1. **Iniciar:** `start-api.bat`
2. **Trabalhar** no sistema
3. **Parar:** `stop-api.bat` ou `CTRL+C`

---

## ⚠️ Problemas Comuns

### "Node.js não encontrado"
**Solução:**
1. Instale Node.js: https://nodejs.org/
2. Baixe versão LTS (recomendada)
3. Reinicie o terminal após instalação
4. Execute `install.bat` novamente

### "Porta 3000 já está em uso"
**Solução:**
1. Execute `stop-api.bat` para parar servidor anterior
2. OU mude a porta no arquivo `api\.env`:
   ```
   PORT=3001
   ```

### "npm não é reconhecido"
**Solução:**
1. Os scripts `.bat` usam caminho completo do npm
2. Não é necessário ter npm no PATH
3. Se quiser usar npm no PowerShell: execute `fix-npm.bat` como Admin

### "Dependências não instaladas"
**Solução:**
1. Execute `install.bat` primeiro
2. Aguarde conclusão (2-3 minutos)
3. Depois execute `start-api.bat`

---

## 📝 Credenciais Padrão

```
Email: admin@example.com
Senha: admin123
```

**⚠️ Mude estas credenciais em produção!**

---

## 🔧 Arquivos de Configuração

### `api\.env`
Configurações do servidor:
```env
PORT=3000
JWT_SECRET=sua-chave-jwt
QR_SECRET=sua-chave-qr
```

### `api\package.json`
Dependências do projeto (não editar manualmente)

---

## 📚 Documentação Completa

- **README.md** - Documentação técnica completa
- **INSTALACAO.md** - Guia detalhado de instalação
- **QUICK_START.md** - Referência rápida de uso

---

## 🆘 Precisa de Ajuda?

1. ✅ Leia `INSTALACAO.md` para guia completo
2. ✅ Verifique mensagens de erro nos scripts
3. ✅ Execute scripts com clique duplo (não pelo PowerShell)
4. ✅ Scripts mostram soluções para erros comuns

---

**Desenvolvido para OS-Web System** 🚀
