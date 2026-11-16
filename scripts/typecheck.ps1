# Typecheck both web and mobile workspaces
Write-Host "Checking apps/web..." -ForegroundColor Cyan
npm run typecheck --workspace=apps/web

Write-Host "Checking apps/mobile..." -ForegroundColor Cyan
npm run typecheck --workspace=apps/mobile
