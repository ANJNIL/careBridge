@echo off
title CareBridge Launcher
echo ==============================================
echo   Launching CareBridge Fullstack System
echo ==============================================

echo [1/2] Launching FastAPI Backend on Port 8000...
start "CareBridge Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python run.py"

echo [2/2] Launching React Frontend...
start "CareBridge Frontend (Vite/React)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Both services are now running!
echo - Backend:  http://127.0.0.1:8000/docs
echo - Frontend: Check the React terminal window for localhost URL
echo ==============================================
