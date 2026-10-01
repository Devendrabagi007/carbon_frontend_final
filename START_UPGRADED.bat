@echo off
cd /d "%~dp0"
py -m pip install -r requirements.txt
if errorlevel 1 goto failure
py manage_upgraded.py migrate
if errorlevel 1 goto failure
echo.
echo Open http://127.0.0.1:8000/ in your browser.
echo Press Ctrl+C to stop the server.
py manage_upgraded.py runserver
pause
exit /b
:failure
echo.
echo Setup failed. Read the error above before trying again.
pause
exit /b 1
