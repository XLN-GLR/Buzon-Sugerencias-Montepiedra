@echo off
chcp 65001 > nul
title Buzón de Sugerencias Montepiedra - Iniciador Local

echo ========================================================
echo   Iniciador del Proyecto: Buzón de Sugerencias
echo ========================================================
echo.

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado o no se encuentra en el PATH.
    echo Por favor, instala Node.js LTS desde: https://nodejs.org/
    echo O ejecuta el siguiente comando en una terminal como administrador:
    echo   winget install OpenJS.NodeJS.LTS
    echo.
    pause
    exit /b 1
)

echo [✓] Node.js detectado:
node -v
echo.

:: Preguntar qué iniciar
echo Seleccione una opción para ejecutar:
echo   1. Ejecutar solo el Frontend (Modo Offline / LocalStorage Simulador)
echo   2. Ejecutar Frontend y Backend (Requiere configuración de Supabase en backend/.env)
echo   3. Salir
echo.
set /p opcion="Opción (1-3): "

if "%opcion%"=="1" goto frontend_only
if "%opcion%"=="2" goto frontend_and_backend
if "%opcion%"=="3" goto exit_script
goto invalid_option

:frontend_only
echo.
echo Iniciando frontend en modo simulador local...
cd frontend
echo Instalando dependencias del frontend si es necesario...
call npm install
echo Iniciando servidor de desarrollo...
call npm run dev
goto exit_script

:frontend_and_backend
echo.
if not exist "backend\.env" (
    echo [ADVERTENCIA] No se encontró el archivo backend\.env
    echo Para que el backend funcione correctamente, crea un archivo backend\.env con tus credenciales:
    echo   SUPABASE_URL=tu_url_de_supabase
    echo   SUPABASE_KEY=tu_anon_key_de_supabase
    echo.
    echo ¿Desea iniciar el backend de todas formas? (S/N)
    set /p continuar="Respuesta: "
    if /i "%continuar%" neq "S" goto exit_script
)

echo Iniciando backend en una nueva ventana...
start "Servidor Backend" cmd /c "cd backend && npm install && node index.js"

echo Iniciando frontend...
cd frontend
call npm install
call npm run dev
goto exit_script

:invalid_option
echo Opción inválida.
pause
exit /b 1

:exit_script
echo Saliendo del iniciador...
pause
