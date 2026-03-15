@echo off
setlocal EnableExtensions

REM ==============================================
REM  RODAR.bat - inicia o app local e abre no Chrome
REM ==============================================

cd /d "%~dp0"

echo.
echo ==============================================
echo  Biometria - Inicializador local
echo ==============================================
echo Pasta: %cd%
echo.

REM 0) Checar se Node/NPM existem
where node >nul 2>nul
if errorlevel 1 (
  echo [RODAR] ERRO: Node.js nao encontrado no PATH.
  echo [RODAR] Instale o Node.js LTS e reinicie o computador.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [RODAR] ERRO: NPM nao encontrado no PATH.
  echo [RODAR] Reinstale o Node.js LTS.
  pause
  exit /b 1
)

REM 1) Instalar dependências se não existir node_modules
if not exist "node_modules" (
  echo [RODAR] Instalando dependencias - npm install...
  call npm install
  if errorlevel 1 (
    echo [RODAR] Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)

REM 2) Iniciar servidor em outra janela
echo [RODAR] Iniciando servidor Next.js...
start "Biometria - Server" cmd /k "npm run dev"

REM 3) Aguardar o servidor subir
echo [RODAR] Aguardando servidor ficar pronto (porta 3000)...
powershell -NoProfile -Command "for($i=0; $i -lt 45; $i++){ if((Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet)){ break }; Start-Sleep -Seconds 1 }" >nul 2>&1

REM 4) Abrir no Google Chrome (se existir). Se nao existir, abre no navegador padrao.
set "URL=http://localhost:3000"

set "CHROME1=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME2=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%CHROME1%" (
  start "" "%CHROME1%" "%URL%"
) else (
  if exist "%CHROME2%" (
    start "" "%CHROME2%" "%URL%"
  ) else (
    start "" "%URL%"
  )
)

REM Preserva a URL para exibir depois do endlocal
endlocal & set "URL_OUT=http://localhost:3000"

REM Mantem esta janela aberta caso voce tenha clicado duas vezes no .bat
echo.
echo [RODAR] Pronto. Se o navegador nao abriu, acesse: %URL_OUT%
echo [RODAR] Para parar o servidor, feche a janela "Biometria - Server".
pause
