@echo off
cd /d "%~dp0"

netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul
if not errorlevel 1 (
  echo El puerto 5173 ya esta ocupado.
  echo Cierra el frontend anterior antes de iniciar este proyecto.
  pause
  exit /b 1
)

echo Iniciando React en http://localhost:5173
echo Presiona Ctrl+C para detenerlo.
echo.
call npm run dev
echo.
echo El frontend se detuvo o no pudo iniciar.
pause
