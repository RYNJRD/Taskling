# Chorely Setup Script for Windows
# This script automates initial environment setup

Write-Host "🎉 Welcome to Chorely Setup!" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Setup root .env file
Write-Host ""
Write-Host "📝 Setting up root .env..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "📋 Created .env from .env.example" -ForegroundColor Yellow
    Write-Host "⚠️  Edit .env with your PostgreSQL DATABASE_URL and Firebase credentials" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env already exists, skipping..." -ForegroundColor Green
}

# Setup client .env.local file
Write-Host ""
Write-Host "📝 Setting up client/.env.local..." -ForegroundColor Cyan
if (-not (Test-Path "client\.env.local")) {
    Copy-Item "client\.env.example" "client\.env.local"
    Write-Host "📋 Created client/.env.local from client/.env.example" -ForegroundColor Yellow
    Write-Host "⚠️  Edit client/.env.local with your Firebase client credentials" -ForegroundColor Yellow
} else {
    Write-Host "✅ client/.env.local already exists, skipping..." -ForegroundColor Green
}

Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env with your DATABASE_URL and Firebase Admin credentials"
Write-Host "2. Edit client/.env.local with your Firebase client credentials"
Write-Host "3. Run: npm run db:push  (to set up the database)"
Write-Host "4. Run: npm run dev     (to start development server)"
Write-Host ""
Write-Host "🔗 Setup Guides:" -ForegroundColor Cyan
Write-Host "   • PostgreSQL: See DATABASE_SETUP.md"
Write-Host "   • Firebase: See FIREBASE_SETUP.md"
Write-Host ""
Write-Host "Need help? Check the README.md or FIREBASE_SETUP.md for detailed instructions." -ForegroundColor Green
