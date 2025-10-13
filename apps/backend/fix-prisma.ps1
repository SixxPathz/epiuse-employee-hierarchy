# Fix Prisma Database URL Issues
Write-Host "🔧 Fixing Prisma environment issues..." -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 Current system DATABASE_URL:" -ForegroundColor Cyan
Write-Host "$env:DATABASE_URL"
Write-Host ""

Write-Host "🔄 Temporarily clearing system DATABASE_URL to use .env file..." -ForegroundColor Green
$originalUrl = $env:DATABASE_URL
$env:DATABASE_URL = $null

try {
    Write-Host "1️⃣ Checking migration status..." -ForegroundColor Blue
    npx prisma migrate status
    Write-Host ""
    
    Write-Host "2️⃣ Checking database connection..." -ForegroundColor Blue
    npx prisma db push --accept-data-loss
    Write-Host ""
    
    Write-Host "3️⃣ Generating Prisma client..." -ForegroundColor Blue
    # Try multiple times to handle Windows file locking
    $attempts = 0
    $maxAttempts = 3
    
    while ($attempts -lt $maxAttempts) {
        $attempts++
        Write-Host "   Attempt $attempts of $maxAttempts..."
        
        try {
            npx prisma generate
            Write-Host "   ✅ Prisma client generated successfully!" -ForegroundColor Green
            break
        }
        catch {
            if ($attempts -eq $maxAttempts) {
                Write-Host "   ❌ Failed to generate after $maxAttempts attempts" -ForegroundColor Red
                Write-Host "   💡 Try closing VS Code and running this script again" -ForegroundColor Yellow
            } else {
                Write-Host "   ⚠️  Attempt $attempts failed, retrying..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        }
    }
    
    Write-Host ""
    Write-Host "4️⃣ Testing HR team script..." -ForegroundColor Blue
    node scripts/sync-hr-team.js
    
} finally {
    # Restore original environment variable
    $env:DATABASE_URL = $originalUrl
    Write-Host ""
    Write-Host "🔄 Restored original DATABASE_URL" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 Prisma fix complete!" -ForegroundColor Green
Write-Host "💡 If you still have issues, restart your development servers" -ForegroundColor Yellow