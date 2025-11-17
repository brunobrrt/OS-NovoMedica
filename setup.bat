@echo off
REM Script de setup do Sistema OS com QR Code para Windows
REM Execute com: setup.bat

echo ========================================
echo   Sistema de Ordem de Servico com QR
echo ========================================
echo.
echo 🚀 Verificando pre-requisitos...
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: Node.js nao encontrado!
    echo.
    echo 📥 Por favor, instale o Node.js antes de continuar:
    echo.
    echo    1. Acesse: https://nodejs.org/
    echo    2. Baixe a versao LTS ^(recomendada^)
    echo    3. Execute o instalador
    echo    4. Reinicie o terminal/prompt
    echo    5. Execute este script novamente
    echo.
    echo 💡 O Node.js ja inclui o npm automaticamente.
    echo.
    pause
    exit /b 1
)

REM Verificar se npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: npm nao encontrado!
    echo.
    echo 💡 O npm geralmente vem com o Node.js.
    echo    Tente reinstalar o Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f %%i in ('node --version') do echo ✅ Node.js %%i encontrado
for /f %%i in ('npm --version') do echo ✅ npm %%i encontrado
echo.

REM Criar diretório de logs se não existir
if not exist "api\logs" mkdir api\logs

REM Entrar no diretório da API
cd api

REM Instalar dependências
echo 📦 Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias.
    cd ..
    pause
    exit /b 1
)

REM Copiar arquivo de ambiente se não existir
if not exist .env (
    echo ⚙️ Criando arquivo de configuracao...
    copy .env.example .env >nul
    echo ✅ Arquivo .env criado. Edite-o com suas configuracoes especificas.
) else (
    echo ✅ Arquivo .env ja existe.
)

REM Voltar ao diretório raiz
cd ..

echo.
echo 🔧 Configuracao concluida!
echo.
echo Para iniciar o sistema:
echo 1. API: cd api ^&^& npm run dev
echo 2. Frontend: Abra os-dashboard.html em um navegador
echo 3. Demo: Abra demo-qr.html para demonstracao interativa
echo.
echo 📝 Credenciais padrao:
echo    Email: admin@example.com
echo    Senha: admin123
echo.
echo 🔗 Endpoints importantes:
echo    API: http://localhost:3000/api
echo    Docs: Consulte README.md
echo.
echo 🧪 Para executar testes:
echo    cd api ^&^& npm test
echo.
echo ✅ Setup concluido com sucesso!
echo.
pause
exit /b 0