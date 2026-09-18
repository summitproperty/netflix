@echo off
setlocal
REM ---------------------------------------------------------------------------
REM start-local.cmd - double-click this on Windows to run Nafij Netflix locally.
REM
REM It runs the setup check (Node version, .env.local, dependencies) and then
REM starts the dev server. Safe to run repeatedly: setup never overwrites an
REM existing .env.local and never reinstalls when node_modules is already there.
REM
REM Close the window (or press Ctrl+C) to stop the server.
REM ---------------------------------------------------------------------------

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found on this machine.
  echo Install the current LTS from https://nodejs.org and run this file again.
  echo.
  pause
  exit /b 1
)

echo.
echo === Nafij Netflix : local setup ===
call npm run setup
if errorlevel 1 (
  echo.
  echo Setup did not finish. Read the message above, fix it, then run this again.
  echo.
  pause
  exit /b 1
)

echo.
echo === Starting the dev server ===
echo Open http://localhost:3000 in your browser once it says "Ready".
echo Press Ctrl+C in this window to stop it.
echo.

REM Open the browser by itself a few seconds later, once Next.js is compiling.
REM If it opens too early just refresh the tab - the server is still starting.
start "" /b cmd /c "timeout /t 12 >nul & start "" http://localhost:3000"

call npm run dev

pause
