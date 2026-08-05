@echo off
chcp 65001 >nul
title Procer - Ativar automacao (painel)
cd /d "%~dp0"

echo.
echo ========================================
echo   ATIVAR AUTOMACAO NO PAINEL
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)

if not exist config.json (
    echo [ERRO] config.json nao encontrado.
    echo Execute 0-CONFIGURAR-LOGIN.bat primeiro.
    pause
    exit /b 1
)

findstr /C:"SEU_USUARIO" config.json >nul 2>&1
if not errorlevel 1 (
    echo [ERRO] Configure login no config.json (0-CONFIGURAR-LOGIN.bat)
    pause
    exit /b 1
)

echo Deixe esta janela ABERTA.
echo No site Render deve aparecer "Automacao ativa" (bolinha verde).
echo Clique "Processar pendentes" no painel quando quiser.
echo.
echo Pressione Ctrl+C para encerrar.
echo.

node bridge.js
if errorlevel 1 (
    echo.
    echo [ERRO] Encerrado com erro. Copie a mensagem acima.
    pause
)
