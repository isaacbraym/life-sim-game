@echo off
chcp 65001 >nul
echo.
echo ==========================================
echo   Captura Vida 2.5D - Iniciando...
echo ==========================================
echo.

REM Caminho do projeto - ajuste se necessario
set "PROJETO=C:\PROJETOS\Projeto_Vida2_5_D\life-sim-game"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0CAPTURA_VIDA25D.ps1" -CaminhoRaiz "%PROJETO%"

echo.
pause
