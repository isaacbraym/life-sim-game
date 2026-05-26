@echo off
setlocal
chcp 65001 >nul

if "%~1"=="" (
  echo Arraste um arquivo .png para cima deste .bat.
  echo.
  pause
  exit /b 1
)

set "SCRIPT_DIR=%~dp0"
set "PY_SCRIPT=%SCRIPT_DIR%fatiar_sprites_v2.py"
for %%I in ("%SCRIPT_DIR%..\..\..") do set "PROJECT_ROOT=%%~fI"
set "LOCAL_SITE=%PROJECT_ROOT%\Lib\site-packages"
set "PYTHONPATH=%PROJECT_ROOT%;%PROJECT_ROOT%\Lib;%LOCAL_SITE%;%PYTHONPATH%"

set "PYTHON_CMD="

where py >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=py -3"
)

if "%PYTHON_CMD%"=="" (
  where python >nul 2>nul
  if not errorlevel 1 (
    set "PYTHON_CMD=python"
  )
)

if "%PYTHON_CMD%"=="" (
  if exist "C:\Python313\python.exe" (
    set "PYTHON_CMD=C:\Python313\python.exe"
  )
)

if "%PYTHON_CMD%"=="" (
  echo Python nao encontrado. Instale Python 3 e tente novamente.
  echo.
  pause
  exit /b 1
)

%PYTHON_CMD% -c "from PIL import Image" >nul 2>nul
if errorlevel 1 (
  echo Pillow nao encontrado. Instalando automaticamente...
  echo.
  if not exist "%LOCAL_SITE%" mkdir "%LOCAL_SITE%"
  %PYTHON_CMD% -m pip install --upgrade Pillow --target "%LOCAL_SITE%"
)

%PYTHON_CMD% -c "from PIL import Image" >nul 2>nul
if errorlevel 1 (
  echo.
  echo Nao consegui importar Pillow automaticamente.
  echo Rode manualmente:
  echo   %PYTHON_CMD% -m pip install Pillow
  echo.
  pause
  exit /b 1
)

%PYTHON_CMD% "%PY_SCRIPT%" "%~1"
set "EXIT_CODE=%errorlevel%"
echo.
pause
exit /b %EXIT_CODE%
