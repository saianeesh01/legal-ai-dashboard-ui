# 🚀 Database Production Setup Guide

This guide will help you set up the Legal AI Dashboard database for production use, fixing all connection issues.

## 📋 **Prerequisites**

- PostgreSQL 12+ installed and running
- PowerShell (for Windows setup scripts)
- Node.js 18+ installed

## 🔧 **Quick Setup (Windows)**

### **Option 1: Automated Setup Script**

1. **Run the setup script:**
   ```powershell
   cd server/scripts
   .\setup-database.ps1
   ```

2. **For production with SSL:**
   ```powershell
   .\setup-database.ps1 -Host "your-db-host.com" -Password "secure-password" -UseSSL
   ```

### **Option 2: Manual Setup**

1. **Create environment file:**
   ```bash
   # Copy the template
   cp server/env.production.template server/.env
   ```

2. **Edit the .env file with your values:**
   ```bash
   # Database Configuration
   DB_HOST=your-database-host.com
   DB_PORT=5432
   DB_NAME=legal_ai_db
   DB_USER=legal_ai_user
   DB_PASSWORD=your-secure-password
   
   # SSL Configuration
   DB_SSL=true
   DB_SSL_MODE=require
   
   # Environment
   NODE_ENV=production
   ```

## 🗄️ **PostgreSQL Setup**

### **1. Install PostgreSQL**

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Use the installer with default settings

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### **2. Create Database and User**

```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Create user
CREATE USER legal_ai_user WITH PASSWORD 'your-secure-password';

-- Create database
CREATE DATABASE legal_ai_db OWNER legal_ai_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE legal_ai_db TO legal_ai_user;

-- Exit
\q
```

### **3. Configure PostgreSQL for Production**

**Edit `postgresql.conf`:**
```bash
# Find your postgresql.conf location
sudo find / -name "postgresql.conf" 2>/dev/null

# Edit the file
sudo nano /etc/postgresql/12/main/postgresql.conf
```

**Add/modify these settings:**
```ini
# Connection settings
listen_addresses = '*'
port = 5432
max_connections = 100

# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# SSL settings (for production)
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

**Edit `pg_hba.conf`:**
```bash
sudo nano /etc/postgresql/12/main/pg_hba.conf
```

**Add these lines:**
```ini
# Local connections
local   all             postgres                                peer
local   all             legal_ai_user                           md5

# Remote connections (adjust IP ranges as needed)
host    all             legal_ai_user           127.0.0.1/32    md5
host    all             legal_ai_user           0.0.0.0/0       md5
```

**Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

## 🔒 **SSL Configuration**

### **1. Generate SSL Certificates (Production)**

```bash
# Create SSL directory
sudo mkdir -p /etc/postgresql/ssl
cd /etc/postgresql/ssl

# Generate private key
sudo openssl genrsa -out server.key 2048

# Generate certificate
sudo openssl req -new -x509 -key server.key -out server.crt -days 365

# Set permissions
sudo chmod 600 server.key
sudo chown postgres:postgres server.key server.crt
```

### **2. Update PostgreSQL SSL Settings**

```ini
# In postgresql.conf
ssl = on
ssl_cert_file = '/etc/postgresql/ssl/server.crt'
ssl_key_file = '/etc/postgresql/ssl/server.key'
ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL'
```

## 🌐 **Environment Configuration**

### **Development (.env)**
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=legal_ai_db
DB_USER=legal_ai_user
DB_PASSWORD=legal_ai_password

# SSL Configuration
DB_SSL=false
DB_SSL_MODE=disable

# Environment
NODE_ENV=development
```

### **Production (.env.production)**
```bash
# Database Configuration
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=legal_ai_db
DB_USER=legal_ai_user
DB_PASSWORD=your-secure-password

# SSL Configuration
DB_SSL=true
DB_SSL_MODE=require

# Connection Pool Settings
DB_MAX_CONNECTIONS=50
DB_MIN_CONNECTIONS=5
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000

# Environment
NODE_ENV=production
```

## 🧪 **Testing the Connection**

### **1. Test with psql**
```bash
# Test connection
psql -h your-host -p 5432 -U legal_ai_user -d legal_ai_db

# If successful, you'll see the psql prompt
legal_ai_db=>
```

### **2. Test with Node.js**
```bash
# Test the health endpoint
curl http://localhost:5000/api/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

### **3. Test Database Operations**
```bash
# Check if jobs can be created
curl -X POST http://localhost:5000/api/upload \
  -F "file=@test-document.pdf"
```

## 🚨 **Troubleshooting**

### **Common SSL Issues**

**Error: "The server does not support SSL connections"**
```bash
# Solution: Disable SSL for local development
DB_SSL=false
DB_SSL_MODE=disable
```

**Error: "password authentication failed"**
```bash
# Solution: Check user credentials
sudo -u postgres psql -c "\du legal_ai_user"
```

**Error: "connection refused"**
```bash
# Solution: Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if port is listening
sudo netstat -tlnp | grep 5432
```

### **Connection Pool Issues**

**Error: "too many connections"**
```bash
# Solution: Increase max_connections in postgresql.conf
max_connections = 200

# Or reduce pool size in environment
DB_MAX_CONNECTIONS=20
```

**Error: "connection timeout"**
```bash
# Solution: Increase timeout values
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=60000
```

## 📊 **Performance Tuning**

### **PostgreSQL Settings**
```ini
# Memory
shared_buffers = 25% of RAM
effective_cache_size = 75% of RAM
work_mem = 4MB
maintenance_work_mem = 64MB

# Connections
max_connections = 100
```

### **Application Settings**
```bash
# Connection pool
DB_MAX_CONNECTIONS=50
DB_MIN_CONNECTIONS=5

# Timeouts
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000
```

## 🔄 **Migration and Updates**

### **1. Run Database Migrations**
```bash
npm run db:push
```

### **2. Update Schema**
```bash
# Generate new migration
npx drizzle-kit generate

# Apply migration
npx drizzle-kit push
```

## 📈 **Monitoring and Maintenance**

### **1. Check Connection Status**
```bash
# Monitor active connections
SELECT count(*) FROM pg_stat_activity;

# Check connection pool status
SELECT * FROM pg_stat_database;
```

### **2. Regular Maintenance**
```bash
# Vacuum database
VACUUM ANALYZE;

# Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

## ✅ **Verification Checklist**

- [ ] PostgreSQL installed and running
- [ ] Database and user created
- [ ] SSL certificates configured (production)
- [ ] Environment variables set
- [ ] Connection test successful
- [ ] Health endpoint returns "connected"
- [ ] File upload works
- [ ] Universal extraction works
- [ ] Performance acceptable

## 🎯 **Next Steps**

1. **Test the system** with your court document
2. **Monitor performance** and adjust settings
3. **Set up backups** for production data
4. **Configure logging** for debugging
5. **Set up monitoring** for database health

## 🆘 **Support**

If you encounter issues:

1. Check the logs: `npm run dev`
2. Test database connection: `psql -h host -U user -d database`
3. Verify environment variables
4. Check PostgreSQL configuration
5. Review this guide for troubleshooting steps

---

**🎉 Congratulations!** Your Legal AI Dashboard database is now production-ready with proper SSL support, connection pooling, and error handling.
