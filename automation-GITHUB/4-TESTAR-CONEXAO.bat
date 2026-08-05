@echo off
chcp 65001 >nul
title Procer - Testar conexao Render
cd /d "%~dp0"

echo.
echo ========================================
echo   TESTAR CONEXAO COM O RENDER
echo ========================================
echo.

if not exist config.json (
    echo [ERRO] config.json nao encontrado.
    pause
    exit /b 1
)

node -e "const c=require('./config.json');(async()=>{try{const h=await fetch(c.api_url+'/api/health');console.log('Health:',h.status,await h.text());const b=await fetch(c.api_url+'/api/automacao/heartbeat',{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':c.api_key}});console.log('Heartbeat:',b.status,await b.text());const s=await fetch(c.api_url+'/api/automacao/status');console.log('Status:',await s.text());}catch(e){console.error('ERRO:',e.message);process.exit(1)}})()"

echo.
pause
