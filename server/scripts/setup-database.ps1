# Database Setup Script for Legal AI Dashboard
# This script helps set up PostgreSQL for production use

param(
    [string]$DatabaseHost = "localhost",
    [int]$Port = 5432,
    [string]$Database = "legal_ai_db",
    [string]$Username = "legal_ai_user",
    [string]$Password = "legal_ai_password",
    [switch]$UseSSL,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Database Setup Script for Legal AI Dashboard

Usage: .\setup-database.ps1 [options]

Options:
    -DatabaseHost <string>        Database host (default: localhost)
    -Port <int>          Database port (default: 5432)
    -Database <string>   Database name (default: legal_ai_db)
    -Username <string>   Database username (default: legal_ai_user)
    -Password <string>   Database password (default: legal_ai_password)
    -UseSSL              Enable SSL connections
    -Help                Show this help message

Examples:
    .\setup-database.ps1
    .\setup-database.ps1 -DatabaseHost "db.example.com" -UseSSL
    .\setup-database.ps1 -Password "my-secure-password"
"@
    exit 0
}

Write-Host "🚀 Setting up PostgreSQL database for Legal AI Dashboard..." -ForegroundColor Green

# Check if PostgreSQL is installed
try {
    $pgVersion = psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL found: $pgVersion" -ForegroundColor Green
    }
    else {
        Write-Host "❌ PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
        Write-Host "💡 Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    Write-Host "💡 Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Test connection to PostgreSQL
Write-Host "🔍 Testing PostgreSQL connection..." -ForegroundColor Yellow

try {
    $env:PGPASSWORD = $Password
    $testResult = psql -h $DatabaseHost -p $Port -U $Username -d postgres -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully connected to PostgreSQL" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to connect to PostgreSQL" -ForegroundColor Red
        Write-Host "Error: $testResult" -ForegroundColor Red
        
        # Try to create user and database
        Write-Host "🔧 Attempting to create user and database..." -ForegroundColor Yellow
        
        try {
            # Connect as postgres superuser
            $createUser = psql -h $DatabaseHost -p $Port -U postgres -c "CREATE USER $Username WITH PASSWORD '$Password';" 2>&1
            $createDb = psql -h $DatabaseHost -p $Port -U postgres -c "CREATE DATABASE $Database OWNER $Username;" 2>&1
            $grantPrivileges = psql -h $DatabaseHost -p $Port -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $Database TO $Username;" 2>&1
            
            Write-Host "✅ User and database created successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Failed to create user/database. You may need to run as postgres superuser." -ForegroundColor Red
            Write-Host "💡 Try: sudo -u postgres psql" -ForegroundColor Yellow
            exit 1
        }
    }
}
catch {
    Write-Host "❌ Connection test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create environment file
Write-Host "📝 Creating environment configuration..." -ForegroundColor Yellow

$envContent = @"
# Database Configuration
DB_HOST=$DatabaseHost
DB_PORT=$Port
DB_NAME=$Database
DB_USER=$Username
DB_PASSWORD=$Password

# SSL Configuration
DB_SSL=$($UseSSL.IsPresent)
DB_SSL_MODE=$($UseSSL.IsPresent -and "require" -or "disable")

# Connection Pool Settings
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=2
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY=1000

# Environment
NODE_ENV=development
PORT=5000

# Security
ENCRYPTION_KEY=your-secret-encryption-key-here
JWT_SECRET=your-jwt-secret-here

# AI Service Configuration
AI_SERVICE_URL=http://localhost:5001
OLLAMA_BASE_URL=http://localhost:11434
"@

$envContent | Out-File -FilePath "server\.env" -Encoding UTF8
Write-Host "✅ Environment file created: server\.env" -ForegroundColor Green

# Test the new configuration
Write-Host "🧪 Testing new database configuration..." -ForegroundColor Yellow

try {
    $env:PGPASSWORD = $Password
    $testResult = psql -h $DatabaseHost -p $Port -U $Username -d $Database -c "SELECT current_database(), current_user;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database configuration test successful!" -ForegroundColor Green
        Write-Host "📊 Database: $Database" -ForegroundColor Cyan
        Write-Host "👤 User: $Username" -ForegroundColor Cyan
        Write-Host "🌐 Host: $DatabaseHost:$Port" -ForegroundColor Cyan
        Write-Host "🔒 SSL: $($UseSSL.IsPresent -and "Enabled" -or "Disabled")" -ForegroundColor Cyan
    }
    else {
        Write-Host "❌ Database configuration test failed" -ForegroundColor Red
        Write-Host "Error: $testResult" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Configuration test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Database setup completed!" -ForegroundColor Green
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review the generated .env file" -ForegroundColor White
Write-Host "   2. Update encryption keys and secrets" -ForegroundColor White
Write-Host "   3. Restart your application" -ForegroundColor White
Write-Host "   4. Run database migrations if needed" -ForegroundColor White

