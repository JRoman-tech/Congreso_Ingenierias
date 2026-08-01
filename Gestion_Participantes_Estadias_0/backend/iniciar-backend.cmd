@echo off
cd /d "%~dp0"

netstat -ano | findstr /R /C:":3001 .*LISTENING" >nul
if not errorlevel 1 (
  echo El puerto 3001 ya esta ocupado.
  echo Cierra el backend anterior antes de iniciar este proyecto.
  pause
  exit /b 1
)

echo Iniciando Spring Boot en http://localhost:3001
echo Presiona Ctrl+C para detenerlo.
echo.
call mvnw.cmd spring-boot:run
echo.
echo El backend se detuvo o no pudo iniciar.
pause

