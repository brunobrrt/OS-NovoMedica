@echo off
REM Script para corrigir problema de execucao do npm no PowerShell
REM Execute como ADMINISTRADOR

echo ========================================
echo   Corrigir Execucao do NPM
echo ========================================
echo.
echo Este script vai liberar a execucao de scripts do PowerShell
echo para o usuario atual, permitindo que o npm funcione.
echo.
echo IMPORTANTE: Este script precisa ser executado como ADMINISTRADOR
echo.
pause

echo.
echo Configurando politica de execucao...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Configuracao aplicada com sucesso!
    echo.
    echo Agora voce pode:
    echo 1. Fechar este terminal
    echo 2. Abrir um novo PowerShell
    echo 3. Executar: npm --version
    echo.
) else (
    echo.
    echo ❌ Erro ao aplicar configuracao.
    echo.
    echo Tente executar manualmente como Administrador:
    echo.
    echo    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    echo.
)

pause
