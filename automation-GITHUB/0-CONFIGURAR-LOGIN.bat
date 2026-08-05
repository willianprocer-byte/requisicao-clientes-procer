@echo off
chcp 65001 >nul
title Procer - Abrir config
cd /d "%~dp0"
notepad config.json
