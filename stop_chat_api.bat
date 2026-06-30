@echo off
title Stop chat_api

echo.
echo   Stopping chat_api ...

set "PS_SCRIPT=%TEMP%\stop_chat_api.ps1"
echo $procs = Get-Process python -ErrorAction SilentlyContinue ^| Where-Object { $_.CommandLine -match 'chat_api' } > "%PS_SCRIPT%"
echo if ($procs) { >> "%PS_SCRIPT%"
echo   $procs ^| ForEach-Object { $_.Kill(); Write-Host '   [OK] Stopped PID:' $_.Id } >> "%PS_SCRIPT%"
echo } else { >> "%PS_SCRIPT%"
echo   Write-Host '   [INFO] No chat_api process found.' >> "%PS_SCRIPT%"
echo } >> "%PS_SCRIPT%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
set "EXIT_CODE=%errorlevel%"
del "%PS_SCRIPT%" 2>nul
if %EXIT_CODE% neq 0 echo   [WARN] PowerShell exited with code %EXIT_CODE%

echo.
echo   Done.
pause
