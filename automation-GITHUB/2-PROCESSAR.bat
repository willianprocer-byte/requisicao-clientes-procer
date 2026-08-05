@echo off
chcp 65001 >nul
title Procer - Processar requisicoes
cd /d "%~dp0"

echo.
echo ========================================
echo   PROCESSAR REQUISICOES DE AMOSTRAGEM
echo ========================================
echo.

if not exist config.json (
    echo [ERRO] config.json nao encontrado.
    echo Copie config.example.json para config.json e preencha login/senha.
    pause
    exit /b 1
)

findstr /C:"SEU_USUARIO" config.json >nul 2>&1
if not errorlevel 1 (
    echo [ERRO] Voce ainda nao configurou o login no config.json
    echo.
    echo Abra o arquivo config.json e troque:
    echo   "usuario": "SEU_USUARIO"  --^>  seu login do CeresWeb
    echo   "senha": "SUA_SENHA"      --^>  sua senha do CeresWeb
    echo.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Execute 1-INSTALAR.bat primeiro.
    pause
    exit /b 1
)

echo Processando requisicoes pendentes...
echo O navegador vai abrir automaticamente.
echo.
call npm run processar

echo.
echo ========================================
echo   FIM
echo ========================================
echo.
pause
