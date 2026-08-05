@echo off
chcp 65001 >nul
title Procer - Instalar automacao
cd /d "%~dp0"

echo.
echo ========================================
echo   INSTALAR AUTOMACAO PROCER
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado.
    echo Baixe em: https://nodejs.org
    pause
    exit /b 1
)

echo Node: 
node --version
echo.

echo Instalando dependencias...
call npm install
if errorlevel 1 (
    echo [ERRO] Falha no npm install
    pause
    exit /b 1
)

echo.
echo Baixando navegador Chromium (pode demorar)...
call npm run install-browser
if errorlevel 1 (
    echo [ERRO] Falha ao instalar navegador
    pause
    exit /b 1
)

echo.
echo ========================================
echo   INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Proximo passo:
echo 1. Edite o arquivo config.json com seu login do CeresWeb
echo 2. Execute 2-PROCESSAR.bat
echo.
pause
