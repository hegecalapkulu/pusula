@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Pusula Planlayıcı masaüstü kısayolu oluşturuluyor...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell; ^
   $Desktop = [Environment]::GetFolderPath('Desktop'); ^
   $Shortcut = $WshShell.CreateShortcut("$Desktop\Pusula Planlayıcı.lnk"); ^
   $Shortcut.TargetPath = "%~dp0Pusula_Baslat_Windows.bat"; ^
   $Shortcut.WorkingDirectory = "%~dp0"; ^
   $Shortcut.WindowStyle = 7; ^
   if (Test-Path "%~dp0pusula.ico") { $Shortcut.IconLocation = "%~dp0pusula.ico" }; ^
   $Shortcut.Description = "Pusula — Sürdürülebilir Hayat ve Hedef Planlayıcı"; ^
   $Shortcut.Save()"

echo.
echo [✓] Masaüstünüzde "Pusula Planlayıcı" kısayolu başarıyla oluşturuldu!
echo Artık masaüstündeki ikona çift tıklayarak uygulamayı açabilirsiniz.
echo.
pause
