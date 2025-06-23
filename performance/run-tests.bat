@echo off
REM Script para ejecutar pruebas de rendimiento en Windows
REM Ejecutar desde el directorio raíz del proyecto

echo 🚀 Iniciando pruebas de rendimiento para Nomada Backend
echo ======================================================

REM Verificar que el servidor esté corriendo
echo 📡 Verificando servidor...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: El servidor no está ejecutándose en localhost:3000
    echo    Ejecuta 'npm start' o 'npm run dev' antes de las pruebas
    exit /b 1
)

echo ✅ Servidor verificado

REM Crear directorio para reportes
if not exist "performance\reports" mkdir "performance\reports"
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,4%%dt:~4,2%%dt:~6,2%_%dt:~8,2%%dt:~10,2%%dt:~12,2%"

echo.
echo 🧪 Ejecutando Prueba Básica de Carga...
echo --------------------------------------
npx artillery run performance/basic-load-test.yml --output "performance/reports/basic-%TIMESTAMP%.json"
npx artillery report "performance/reports/basic-%TIMESTAMP%.json" --output "performance/reports/basic-%TIMESTAMP%.html"

echo.
echo 🔥 Ejecutando Prueba de Estrés...
echo --------------------------------
npx artillery run performance/stress-test.yml --output "performance/reports/stress-%TIMESTAMP%.json"
npx artillery report "performance/reports/stress-%TIMESTAMP%.json" --output "performance/reports/stress-%TIMESTAMP%.html"

echo.
echo ⚡ Ejecutando Prueba de Picos...
echo -------------------------------
npx artillery run performance/spike-test.yml --output "performance/reports/spike-%TIMESTAMP%.json"
npx artillery report "performance/reports/spike-%TIMESTAMP%.json" --output "performance/reports/spike-%TIMESTAMP%.html"

echo.
echo 🔍 Ejecutando Prueba de API...
echo -----------------------------
npx artillery run performance/api-test.yml --output "performance/reports/api-%TIMESTAMP%.json"
npx artillery report "performance/reports/api-%TIMESTAMP%.json" --output "performance/reports/api-%TIMESTAMP%.html"

echo.
echo 📊 Pruebas completadas!
echo ======================
echo Reportes generados en performance/reports/
echo - basic-%TIMESTAMP%.html
echo - stress-%TIMESTAMP%.html
echo - spike-%TIMESTAMP%.html
echo - api-%TIMESTAMP%.html
echo.
echo Para ejecutar la prueba de resistencia (30 min), usa:
echo npm run perf:endurance

pause
