@echo off
REM Script para iniciar a API do Sistema OS
REM Execute clicando duas vezes neste arquivo

title Sistema OS - API Server

echo ========================================
echo   Iniciando API - Sistema OS
echo ========================================
echo.

REM Verificar se Node.js esta instalado
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

REM Entrar na pasta api
cd /d "%~dp0api"
if %errorlevel% neq 0 (
    echo ❌ ERRO: Pasta api nao encontrada!
    echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 1
)

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo ❌ ERRO: Dependencias nao instaladas!
    echo.
    echo Por favor, execute primeiro: install.bat
    echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 1
)

REM Verificar se server.js existe
if not exist "server.js" (
    echo ❌ ERRO: Arquivo server.js nao encontrado!
    echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 1
)

echo ✅ Verificacoes concluidas
echo.

REM Verificar se a porta 3000 ja esta em uso
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  AVISO: A porta 3000 ja esta em uso!
    echo.
    echo Um servidor ja esta rodando ou outra aplicacao esta usando a porta.
    echo.
    echo Opcoes:
    echo    1. Feche o outro servidor e tente novamente
    echo    2. Mude a porta no arquivo api\.env
    echo.
    echo Deseja continuar mesmo assim? ^(S/N^)
    choice /C SN /N /M "Escolha: "
    if errorlevel 2 (
        echo.
        echo Operacao cancelada.
        echo.
        echo Pressione qualquer tecla para fechar...
        pause >nul
        exit /b 1
    )
    echo.
)

echo 🚀 Iniciando servidor de desenvolvimento...
echo.
echo 📍 API rodando em: http://localhost:3000
echo.
echo 📝 Credenciais padrao:
echo    Email: admin@example.com
echo    Senha: admin123
echo.
echo ⚠️  Para parar o servidor: Pressione CTRL+C
echo.
echo ========================================
echo.

REM Usar o caminho completo do node
"C:\Program Files\nodejs\node.exe" server.js

REM Se o servidor parar, mostrar mensagem
echo.
echo.
echo ========================================
echo   Servidor Encerrado
echo ========================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
