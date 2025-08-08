# Legal AI Database Setup Script
# This script will help you set up PostgreSQL for the Legal AI application

Write-Host "🔧 Setting up Legal AI Database..." -ForegroundColor Green

# Check if PostgreSQL is installed
$postgresInstalled = Get-Command psql -ErrorAction SilentlyContinue

if (-not $postgresInstalled) {
    Write-Host "📦 PostgreSQL is not installed. Installing..." -ForegroundColor Yellow
    
    # Install PostgreSQL using winget (Windows Package Manager)
    Write-Host "Installing PostgreSQL via winget..." -ForegroundColor Cyan
    winget install PostgreSQL.PostgreSQL
    
    Write-Host "✅ PostgreSQL installation initiated. Please restart your terminal after installation completes." -ForegroundColor Green
    Write-Host "Then run this script again to configure the database." -ForegroundColor Yellow
    exit
}

Write-Host "✅ PostgreSQL is installed!" -ForegroundColor Green

# Set up environment variables
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Cyan

# Create .env file if it doesn't exist
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    @"
# Legal AI Database Configuration
DATABASE_URL=postgresql://legal_ai_user:legal_ai_password@localhost:5432/legal_ai_db
NODE_ENV=development

# AI Service Configuration
AI_SERVICE_URL=http://localhost:5001

# Application Configuration
PORT=5000
CLIENT_PORT=3000
"@ | Out-File -FilePath $envFile -Encoding UTF8
    
    Write-Host "✅ Created .env file with database configuration" -ForegroundColor Green
}

# Create database and user
Write-Host "🗄️ Setting up database..." -ForegroundColor Cyan

# Connect to PostgreSQL as superuser and create database
$createDbScript = @"
-- Create database and user for Legal AI
CREATE DATABASE legal_ai_db;
CREATE USER legal_ai_user WITH PASSWORD 'legal_ai_password';
GRANT ALL PRIVILEGES ON DATABASE legal_ai_db TO legal_ai_user;
ALTER USER legal_ai_user CREATEDB;
"@

# Save the script to a temporary file
$tempScript = "temp_db_setup.sql"
$createDbScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "Running database setup script..." -ForegroundColor Yellow

# Execute the script (you may need to adjust the path to psql)
try {
    # Try to find psql in common locations
    $psqlPath = $null
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\*\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe",
        "$env:PROGRAMFILES\PostgreSQL\*\bin\psql.exe"
    )
    
    foreach ($path in $possiblePaths) {
        $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $psqlPath = $found.FullName
            break
        }
    }
    
    if ($psqlPath) {
        Write-Host "Found psql at: $psqlPath" -ForegroundColor Green
        & $psqlPath -U postgres -f $tempScript
        Write-Host "✅ Database setup completed!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Could not find psql. Please ensure PostgreSQL is properly installed." -ForegroundColor Red
        Write-Host "You may need to manually run the database setup:" -ForegroundColor Yellow
        Write-Host "1. Open pgAdmin or psql" -ForegroundColor Yellow
        Write-Host "2. Run the SQL commands in temp_db_setup.sql" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Error setting up database: $_" -ForegroundColor Red
    Write-Host "You may need to manually create the database:" -ForegroundColor Yellow
    Write-Host "1. Open pgAdmin or psql" -ForegroundColor Yellow
    Write-Host "2. Run the SQL commands in temp_db_setup.sql" -ForegroundColor Yellow
}

# Clean up temporary file
if (Test-Path $tempScript) {
    Remove-Item $tempScript
}

Write-Host "`n🎉 Database setup script completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your terminal to ensure environment variables are loaded" -ForegroundColor Yellow
Write-Host "2. Run: npm run dev (in the server directory)" -ForegroundColor Yellow
Write-Host "3. The application should now connect to the database properly" -ForegroundColor Yellow

Write-Host "`n📋 Database Configuration:" -ForegroundColor Cyan
Write-Host "Database: legal_ai_db" -ForegroundColor White
Write-Host "User: legal_ai_user" -ForegroundColor White
Write-Host "Password: legal_ai_password" -ForegroundColor White
Write-Host "Host: localhost" -ForegroundColor White
Write-Host "Port: 5432" -ForegroundColor White

