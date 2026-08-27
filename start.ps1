# InterviewIQ local start
Set-Location $PSScriptRoot
docker compose up -d
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\server-go'; .\run.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\client'; npm run dev"
Write-Output "Mongo + Go API + Vite starting. Open http://localhost:5173"
