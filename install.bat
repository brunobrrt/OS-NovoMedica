@echo off
REM Script de instalacao usando CMD (nao requer mudanca de politica)
REM Execute este arquivo clicando duas vezes nele

echo ========================================
echo   Instalar Dependencias - Sistema OS
echo ========================================
echo.
echo 🔧 Verificando Node.js...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% encontrado
echo.

echo 📦 Instalando dependencias...
echo    Isso pode levar alguns minutos...
echo.
echo Pasta: %~dp0api
echo.

REM Entrar na pasta api
cd /d "%~dp0api"
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: Nao foi possivel acessar a pasta api
    echo    Verifique se a pasta existe: %~dp0api
    echo.
    cd /d "%~dp0"
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 1
)

REM Verificar se npm.cmd existe
if not exist "C:\Program Files\nodejs\npm.cmd" (
    echo.
    echo ❌ ERRO: npm.cmd nao encontrado!
    echo    Caminho esperado: C:\Program Files\nodejs\npm.cmd
    echo.
    echo Tente uma destas solucoes:
    echo    1. Reinstale o Node.js: https://nodejs.org/
    echo    2. Verifique se o Node.js esta instalado em outro local
    echo.
    cd /d "%~dp0"
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 1
)

REM Executar npm install
echo Executando: npm install
echo.
"C:\Program Files\nodejs\npm.cmd" install
set INSTALL_RESULT=%errorlevel%

echo.
if %INSTALL_RESULT% equ 0 (
    echo ========================================
    echo   ✅ Instalacao Concluida com Sucesso!
    echo ========================================
    echo.
    
    REM Criar arquivo .env se nao existir
    if not exist .env (
        echo ⚙️ Criando arquivo .env...
        copy .env.example .env >nul 2>&1
        if %errorlevel% equ 0 (
            echo ✅ Arquivo .env criado
        ) else (
            echo ⚠️ Aviso: Nao foi possivel criar .env automaticamente
            echo    Copie manualmente .env.example para .env
        )
    ) else (
        echo ✅ Arquivo .env ja existe
    )
    
    echo.
    echo 🚀 Proximo passo - Iniciar o sistema:
    echo.
    echo    1. Clique duas vezes em: start-api.bat
    echo    2. Abra no navegador: os-dashboard.html
    echo.
    echo 📝 Credenciais padrao:
    echo    Email: admin@example.com
    echo    Senha: admin123
    echo.
) else (
    echo ========================================
    echo   ❌ ERRO Durante a Instalacao!
    echo ========================================
    echo.
    echo Codigo de erro: %INSTALL_RESULT%
    echo.
    echo Possiveis causas:
    echo    1. Problemas de conexao com a internet
    echo    2. Permissoes insuficientes
    echo    3. Porta bloqueada por firewall
    echo.
    echo Solucoes:
    echo    1. Tente executar como Administrador
    echo    2. Verifique sua conexao com a internet
    echo    3. Desabilite temporariamente o antivirus
    echo.
)

REM Voltar para pasta raiz
cd /d "%~dp0"

echo.
echo Pressione qualquer tecla para fechar...
pause >nul
exit /b %INSTALL_RESULT%
