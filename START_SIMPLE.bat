@echo off
cd /d "%~dp0"
py -m pip install -r requirements.txt
if errorlevel 1 goto failure
py manage_simple.py migrate
if errorlevel 1 goto failure
echo Open http://127.0.0.1:8000/ to use the simplified simulator.
py manage_simple.py runserver
pause
exit /b
:failure
echo Setup failed. Read the error above.
pause
exit /b 1
