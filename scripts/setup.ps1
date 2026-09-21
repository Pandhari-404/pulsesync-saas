# PulseSync Windows Setup Automation Script
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "⚡ Bootstrapping PulseSync Full-Stack SaaS" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Server setup
Write-Host "`n[1/3] Setting up Server dependencies and database..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\..\server"
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed

# 2. Client setup
Write-Host "`n[2/3] Setting up Client dependencies..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\..\client"
npm install

# 3. Completion
Set-Location -Path "$PSScriptRoot\.."
Write-Host "`n[3/3] Build complete!" -ForegroundColor Green
Write-Host "`nTo run development servers:" -ForegroundColor Cyan
Write-Host "  Terminal 1 (Backend): cd server; npm run dev" -ForegroundColor White
Write-Host "  Terminal 2 (Frontend): cd client; npm run dev" -ForegroundColor White
Write-Host "`nOpen http://localhost:5173 to test drive PulseSync!" -ForegroundColor Green
