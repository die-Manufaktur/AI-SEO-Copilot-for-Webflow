@echo off
echo Killing development server processes...

REM Kill processes on specific ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :1337') do (
    echo Killing process on port 1337: %%a
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    echo Killing process on port 5173: %%a
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8787') do (
    echo Killing process on port 8787: %%a
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :24678') do (
    echo Killing process on port 24678: %%a
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill any remaining Vite, Wrangler, or Webflow CLI processes
taskkill /F /IM "vite.exe" >nul 2>&1
taskkill /F /IM "wrangler.exe" >nul 2>&1
taskkill /F /IM "webflow.exe" >nul 2>&1

echo Done! You can now restart your development server.
pause