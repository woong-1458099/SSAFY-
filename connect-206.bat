@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo === EC2 SSH connect ===
echo.

set "KEYPATH="
set /p KEYPATH=Enter PEM key file path : 
set "KEYPATH=%KEYPATH:\"=%"
set "KEYPATH=%KEYPATH:"=%"

if not exist "%KEYPATH%" (
  echo ERROR: Key file not found: "%KEYPATH%"
  goto END
)

echo.
echo Using key: "%KEYPATH%"
echo.

icacls "%KEYPATH%" /inheritance:r >nul
icacls "%KEYPATH%" /remove "CodexSandboxUsers" >nul 2>&1
icacls "%KEYPATH%" /grant:r "%USERDOMAIN%\%USERNAME%:(R)" >nul

echo Connecting to ubuntu@j14e206.p.ssafy.io ...
echo.
ssh -i "%KEYPATH%" ubuntu@j14e206.p.ssafy.io

echo.
echo SSH exited.

:END
echo.
pause
endlocal
