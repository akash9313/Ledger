@echo off
echo ========================================================
echo Fixing Windows Long Path Limit for React Native...
echo ========================================================
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
echo.
echo If you saw "The operation completed successfully" above, 
echo the fix worked! Please RESTART YOUR COMPUTER now.
echo.
pause
