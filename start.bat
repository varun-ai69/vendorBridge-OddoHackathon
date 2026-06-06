@echo off
echo ===================================================
echo Starting VendorBridge Development Environment...
echo ===================================================

echo [1/2] Launching Backend Service...
start "VendorBridge Backend" cmd /k "cd backend && npx nodemon server.js || node server.js"

echo [2/2] Launching Frontend Service...
start "VendorBridge Frontend" cmd /k "cd frontend && npm run dev"

echo ===================================================
echo Both services are now starting in separate windows.
echo ===================================================
pause
