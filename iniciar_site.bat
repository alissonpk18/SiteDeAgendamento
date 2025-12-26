@echo off
chcp 65001 >nul
echo ========================================================
echo      INICIANDO O SITE LA BELLE DIVAS (Modo Local)     
echo ========================================================
echo.
echo Iniciando servidor local para carregar os textos e imagens...
echo O navegador abrirá automaticamente em alguns segundos.
echo.
echo Mantenha esta janela aberta enquanto usar o site.
echo.

start http://localhost:8000

python -m http.server 8000
