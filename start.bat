@echo off
cd /d "%~dp0"

echo Liberando portas 8000 e 5173 (se houver algo preso de uma execucao anterior)...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>&1

start "Ryber - Backend" cmd /k "cd backend && .venv\Scripts\activate && uvicorn app.main:app --port 8000"
start "Ryber - Frontend" cmd /k "cd frontend && npm run dev"
