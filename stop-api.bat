@echo off
REM Script para parar a API do Sistema OS
REM Execute clicando duas vezes neste arquivo

title Sistema OS - Parar API

echo ========================================
echo   Parar API - Sistema OS
echo ========================================
echo.

echo 🔍 Procurando servidor na porta 3000...
echo.

REM Encontrar processo usando a porta 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    set PID=%%a
    goto :found
)

echo ❌ Nenhum servidor encontrado na porta 3000
echo.
echo O servidor ja esta parado ou nao foi iniciado.
echo.
goto :end

:found
echo ✅ Servidor encontrado ^(PID: %PID%^)
echo.
echo Deseja parar o servidor? ^(S/N^)
choice /C SN /N /M "Escolha: "
if errorlevel 2 (
    echo.
    echo Operacao cancelada.
    goto :end
)

echo.
echo 🛑 Parando servidor...
taskkill /PID %PID% /F >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Servidor parado com sucesso!
) else (
    echo ❌ Erro ao parar servidor
    echo    Tente executar como Administrador
)
echo.

:end
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
