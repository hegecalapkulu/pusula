@echo off
chcp 65001 >nul
title Pusulapp
cd /d "%~dp0"

REM 1. Python yüklüyse veri sunucusunu arka planda başlat
where python >nul 2>nul
if %errorlevel%==0 (
    start "" /b python server.py --no-browser >nul 2>nul
    timeout /t 1 /nobreak >nul
    set "TARGET_URL=http://localhost:8420"
    goto :OPEN_WINDOW
)

where python3 >nul 2>nul
if %errorlevel%==0 (
    start "" /b python3 server.py --no-browser >nul 2>nul
    timeout /t 1 /nobreak >nul
    set "TARGET_URL=http://localhost:8420"
    goto :OPEN_WINDOW
)

REM 2. Python yoksa doğrudan yerel arayüzü aç
set "TARGET_URL=file:///%~dp0index.html"
set "TARGET_URL=%TARGET_URL:\=/%"

:OPEN_WINDOW
REM Microsoft Edge (Tüm Windows 10 ve 11 cihazlarda standart olarak yüklüdür)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%TARGET_URL%"
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%TARGET_URL%"
    exit
)

REM Google Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%"
    exit
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%"
    exit
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%TARGET_URL%"
    exit
)

REM Diğer tarayıcılar için
start "" "%TARGET_URL%"
exit
