@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Pusulapp — Masaüstü Kısayolu Kurulumu

echo ============================================================
echo   Pusulapp Masaüstü Kurulumu Yapılıyor...
echo ============================================================

set "TARGET_BAT=%~dp0Pusulapp.bat"
set "ICON_FILE=%~dp0pusulapp.ico"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$sc = $ws.CreateShortcut('%DESKTOP_DIR%\Pusulapp.lnk'); " ^
  "$sc.TargetPath = '%TARGET_BAT%'; " ^
  "$sc.WorkingDirectory = '%~dp0'; " ^
  "$sc.Description = 'Pusulapp — Sürdürülebilir Hayat & Hedef Planlayıcı'; " ^
  "if (Test-Path '%ICON_FILE%') { $sc.IconLocation = '%ICON_FILE%,0' }; " ^
  "$sc.WindowStyle = 7; " ^
  "$sc.Save()"

echo.
echo [BAŞARILI] Masaüstünüze 'Pusulapp' uygulama simgesi eklendi!
echo Artık masaüstünüzdeki Pusulapp simgesine tıklayarak doğrudan açabilirsiniz.
echo.
pause
