# Clean build artifacts and temporary files
Write-Host "Cleaning Next.js build..." -ForegroundColor Cyan
if (Test-Path apps\web\.next) { Remove-Item -Recurse -Force apps\web\.next }

Write-Host "Cleaning Android builds..." -ForegroundColor Cyan
if (Test-Path apps\mobile\android\app\build) { Remove-Item -Recurse -Force apps\mobile\android\app\build }

Write-Host "Clean complete." -ForegroundColor Green
