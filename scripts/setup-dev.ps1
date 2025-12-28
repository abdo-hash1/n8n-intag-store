# ===========================================
# n8n SaaS Platform - Development Setup Script (Windows)
# ===========================================

Write-Host "🚀 n8n SaaS Platform - Development Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check for required tools
function Test-Command {
    param([string]$Command)
    $exists = $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
    if ($exists) {
        Write-Host "✓ $Command is installed" -ForegroundColor Green
    } else {
        Write-Host "❌ $Command is not installed. Please install it first." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Checking required tools..."
Test-Command "node"
Test-Command "npm"

Write-Host ""
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install

Write-Host ""
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install

Write-Host ""
Write-Host "⚙️ Setting up environment files..." -ForegroundColor Yellow
Set-Location ../backend
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created backend/.env from .env.example" -ForegroundColor Green
    Write-Host "⚠️ Please edit backend/.env with your database credentials!" -ForegroundColor Yellow
} else {
    Write-Host "✓ backend/.env already exists" -ForegroundColor Green
}

Set-Location ../frontend
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "✓ Created frontend/.env.local from .env.example" -ForegroundColor Green
} else {
    Write-Host "✓ frontend/.env.local already exists" -ForegroundColor Green
}

Set-Location ..

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Next steps:"
Write-Host "1. Configure backend/.env with your PostgreSQL database URL"
Write-Host "2. Run database migrations: cd backend; npx prisma migrate dev"
Write-Host "3. Seed the database: cd backend; npm run prisma:seed"
Write-Host "4. Start the backend: cd backend; npm run dev"
Write-Host "5. Start the frontend: cd frontend; npm run dev"
Write-Host ""
Write-Host "Default credentials after seeding:"
Write-Host "  Admin: admin@n8nsaas.com / Admin@123456"
Write-Host "  User:  test@example.com / User@123456"
Write-Host "=========================================" -ForegroundColor Cyan
