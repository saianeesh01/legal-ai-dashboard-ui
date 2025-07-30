# Legal AI Dashboard - Docker Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Legal AI Dashboard using Docker with multi-container setup:

- **Frontend Container**: React + Express backend (Port 5000)
- **AI Service Container**: Flask + Ollama client (Port 5001)
- **Ollama Host**: Running locally on host machine (Port 11434)

## Prerequisites

### 1. Install Docker & Docker Compose
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# macOS (using Homebrew)
brew install docker docker-compose

# Or install Docker Desktop
```

### 2. Install and Setup Ollama on Host
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the Mistral model
ollama pull mistral:latest

# Start Ollama server
ollama serve
```

Verify Ollama is running:
```bash
curl http://localhost:11434/api/tags
```

### 3. Environment Setup
Create `.env` file in project root:
```env
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
AI_SERVICE_URL=http://ai_service:5001
OLLAMA_HOST=host.docker.internal:11434
```

## Build and Run Instructions

### Option 1: Docker Compose (Recommended)

1. **Build and start all services**:
```bash
docker-compose up --build
```

2. **Run in background**:
```bash
docker-compose up -d --build
```

3. **Check container status**:
```bash
docker-compose ps
```

4. **View logs**:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f ai_service
```

### Option 2: Manual Docker Build

1. **Build frontend container**:
```bash
docker build -t legal-ai-frontend .
```

2. **Build AI service container**:
```bash
docker build -t legal-ai-service ./ai_service
```

3. **Create network**:
```bash
docker network create legal-ai-network
```

4. **Run AI service**:
```bash
docker run -d \
  --name legal-ai-service \
  --network legal-ai-network \
  -p 5001:5001 \
  -e OLLAMA_HOST=host.docker.internal:11434 \
  --add-host host.docker.internal:host-gateway \
  legal-ai-service
```

5. **Run frontend**:
```bash
docker run -d \
  --name legal-ai-frontend \
  --network legal-ai-network \
  -p 5000:5000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e AI_SERVICE_URL=http://ai_service:5001 \
  legal-ai-frontend
```

## Service Health Checks

### Frontend Health Check
```bash
curl http://localhost:5000/api/health
```

### AI Service Health Check
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "healthy",
  "ollama_available": true,
  "ollama_host": "host.docker.internal:11434",
  "available_models": ["mistral:latest"],
  "default_model": "mistral:latest"
}
```

## Testing the System

### 1. Test Document Upload
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@test_document.pdf" \
  -F "filename=test_document.pdf"
```

### 2. Test AI Summarization
```bash
curl -X POST http://localhost:5000/api/documents/JOB_ID/summarize \
  -H "Content-Type: application/json" \
  -d '{"model": "mistral:latest", "max_tokens": 1000}'
```

### 3. Test Advanced Redaction
```bash
curl "http://localhost:5000/api/documents/JOB_ID/redacted-pdf?advanced=true"
```

## Troubleshooting

### Common Issues

#### 1. AI Service Cannot Connect to Ollama
**Symptoms**: `"ollama_available": false` in health check

**Solutions**:
- Verify Ollama is running on host: `curl http://localhost:11434/api/tags`
- Check Docker host networking: `--add-host host.docker.internal:host-gateway`
- On Linux, use `--network host` or replace `host.docker.internal` with actual host IP

#### 2. Frontend Build Errors
**Symptoms**: Container fails to build

**Solutions**:
- Ensure Node.js 22 is specified in Dockerfile
- Clear Docker cache: `docker system prune -a`
- Check package.json dependencies

#### 3. PDF Extraction Fails
**Symptoms**: `"Text extraction failed"` errors

**Solutions**:
- Verify pdfjs-dist version compatibility
- Check PDF file isn't corrupted or password-protected
- Review extraction logs in container

#### 4. Database Connection Issues
**Symptoms**: Database-related errors

**Solutions**:
- Verify DATABASE_URL environment variable
- Check database accessibility from Docker network
- Review PostgreSQL connection settings

### Debug Commands

#### View container logs:
```bash
docker logs legal-ai-frontend
docker logs legal-ai-service
```

#### Connect to running container:
```bash
docker exec -it legal-ai-frontend /bin/bash
docker exec -it legal-ai-service /bin/bash
```

#### Test network connectivity:
```bash
# From frontend container to AI service
docker exec legal-ai-frontend curl http://ai_service:5001/health

# From AI service to Ollama
docker exec legal-ai-service curl http://host.docker.internal:11434/api/tags
```

## Production Deployment

### Performance Optimizations

1. **Multi-stage builds** (already implemented)
2. **Resource limits** in docker-compose.yml:
```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

3. **Health checks** (already implemented)
4. **Restart policies** (already set to `unless-stopped`)

### Security Considerations

1. **Environment variables**: Use Docker secrets for sensitive data
2. **Network security**: Limit exposed ports
3. **User permissions**: Run containers as non-root user
4. **Image scanning**: Use `docker scan` to check for vulnerabilities

### Scaling

#### Horizontal Scaling:
```bash
docker-compose up --scale ai_service=3
```

#### Load Balancing:
Add nginx or traefik reverse proxy for production load balancing.

## Monitoring

### Container Metrics:
```bash
docker stats
```

### Application Metrics:
- Frontend: http://localhost:5000/api/health
- AI Service: http://localhost:5001/health
- Document processing logs in container outputs

## Backup and Recovery

### Database Backup:
```bash
docker exec postgres_container pg_dump -U user database > backup.sql
```

### Document Storage:
Ensure document storage directory is properly mounted and backed up.

## Support

For deployment issues:
1. Check container logs first
2. Verify all services are healthy
3. Test Ollama connectivity manually
4. Review network configuration
5. Check environment variables

The system is designed to be resilient with proper fallback mechanisms for PDF extraction and AI processing.