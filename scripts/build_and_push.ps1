Write-Host "=== Running npx tsc --noEmit ==="
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
  Write-Host "tsc failed with exit code $LASTEXITCODE"
  exit 1
}

Write-Host "=== Running npm run build ==="
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "build failed with exit code $LASTEXITCODE"
  exit 1
}

Write-Host "=== Running git add -A ==="
git add -A

Write-Host "=== Running git commit ==="
git commit -m "fix: reduce no-explicit-any from 119 to 75 - type safe fixes across 15 files"

Write-Host "=== Running git push ==="
git push origin main
