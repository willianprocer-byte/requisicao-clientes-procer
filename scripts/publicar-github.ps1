# Script para publicar no GitHub
# Execute depois de criar o repositório em https://github.com/new

param(
    [Parameter(Mandatory=$true)]
    [string]$UsuarioGitHub
)

$env:Path = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;" + $env:Path
Set-Location "$PSScriptRoot\.."

git branch -M main
git remote remove origin 2>$null
git remote set-url origin https://github.com/willianprocer-byte/requisicao-clientes-procer.git
git push -u origin main

Write-Host ""
Write-Host "Codigo enviado! Proximo passo: deploy no Render.com" -ForegroundColor Green
Write-Host "Veja instrucoes em docs/PUBLICAR.md" -ForegroundColor Yellow
