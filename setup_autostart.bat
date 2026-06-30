@echo off
setlocal enabledelayedexpansion
title chat_api autostart setup

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%~dp0start_chat_api.vbs"
set "LINK_NAME=chat_api_autostart.lnk"
set "PROJECT_DIR=%~dp0"

echo.
echo  ============================================
echo    chat_api - AutoStart Setup
echo  ============================================
echo.
echo   Project dir : %PROJECT_DIR%
echo   Startup dir : %STARTUP_DIR%
echo.

if not exist "%VBS_FILE%" (
    echo   [ERROR] start_chat_api.vbs not found
    echo   Please place this bat next to start_chat_api.vbs
    pause
    exit /b 1
)

echo   Creating startup shortcut ...

set "PS_SCRIPT=%TEMP%\create_shortcut.ps1"

echo $ws = New-Object -ComObject WScript.Shell; > "%PS_SCRIPT%"
echo $s = $ws.CreateShortcut('%STARTUP_DIR%\%LINK_NAME%'); >> "%PS_SCRIPT%"
echo $s.TargetPath = '%VBS_FILE%'; >> "%PS_SCRIPT%"
echo $s.WorkingDirectory = '%PROJECT_DIR%'; >> "%PS_SCRIPT%"
echo $s.WindowStyle = 1; >> "%PS_SCRIPT%"
echo $s.Save(); >> "%PS_SCRIPT%"
echo Write-Host '   [OK] Shortcut created' >> "%PS_SCRIPT%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
set "EXIT_CODE=%errorlevel%"
del "%PS_SCRIPT%" 2>nul

if %EXIT_CODE% equ 0 (
    echo.
    echo   ============================================
    echo     Setup complete!
    echo     chat_api will start on next login.
    echo     URL: http://127.0.0.1:8054
    echo     Log: %PROJECT_DIR%chat_api_startup.log
    echo   ============================================
) else (
    echo   [FAIL] Could not create shortcut. Check permissions.
)

echo.
pause
