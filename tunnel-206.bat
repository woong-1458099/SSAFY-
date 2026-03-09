@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo === EC2 SSH tunnel ===
echo.

set "KEYPATH="
set /p KEYPATH=Enter PEM key file path :
set "KEYPATH=%KEYPATH:"=%"

if not exist "%KEYPATH%" (
  echo ERROR: Key file not found: "%KEYPATH%"
  goto END
)

echo.
echo Using key: "%KEYPATH%"
echo Starting tunnel...
echo.

ssh -i "%KEYPATH%" -N ^
  -L 15432:127.0.0.1:5432 ^
  -L 16379:127.0.0.1:6379 ^
  -L 15673:127.0.0.1:5672 ^
  ubuntu@j14e206.p.ssafy.io

:END
echo.
pause
endlocal