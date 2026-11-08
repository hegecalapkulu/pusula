@echo off
chcp 65001 >nul
title Pusula — Sürdürülebilir Hayat & Hedef Planlayıcı
cd /d "%~dp0"

REM Python yüklüyse yerel veri sunucusunu arka planda başlat
where python >nul 2>nul
if %errorlevel%==0 (
    start "" /b python server.py --no-browser >nul 2>nul
    timeout /t 1 /nobreak >nul
    set "TARGET_URL=http://localhost:8420"
    goto :LAUNCH_APP
)

where python3 >nul 2>nul
if %errorlevel%==0 (
    start "" /b python3 server.py --no-browser >nul 2>nul
    timeout /t 1 /nobreak >nul
    set "TARGET_URL=http://localhost:8420"
    goto :LAUNCH_APP
)

REM Python yüklü değilse doğrudan yerel uygulama dosyasını aç (Veriler tarayıcı hafızasına otomatik kaydedilir)
set "TARGET_URL=file:///%~dp0index.html"
set "TARGET_URL=%TARGET_URL:\=/%"

:LAUNCH_APP
REM Chrome veya Edge varsa bağımsız masaüstü uygulama penceresi (--app) olarak aç
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
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%TARGET_URL%"
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%TARGET_URL%"
    exit
)

REM Varsayılan tarayıcıda aç
start "" "%TARGET_URL%"
exit
