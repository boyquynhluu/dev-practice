# Opens 3 PowerShell windows: backend-java, backend-python, frontend
$root = $PSScriptRoot
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root\backend-java'; mvn spring-boot:run"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root\backend-python'; .venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8082"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$root\frontend'; npm run dev"
Write-Host 'Starting... open http://localhost:5173 in ~20s'
