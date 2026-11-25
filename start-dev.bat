@echo off
rem Bam dup file nay de chay ca 3 server
start "backend-java" cmd /k "cd /d %~dp0backend-java && mvn spring-boot:run"
start "backend-python" cmd /k "cd /d %~dp0backend-python && .venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8082"
start "frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Dang khoi dong... mo http://localhost:5173 sau khoang 20-30 giay
timeout /t 25 >nul
start http://localhost:5173
