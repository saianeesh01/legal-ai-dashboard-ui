# Docker Warmup System Guide

## Overview
The Legal AI platform includes automatic model warmup for Docker containers to eliminate cold start delays when processing legal documents.

## Docker Configuration

### 1. Environment Variables
```yaml
# In docker-compose.yml
environment:
  DATABASE_URL: "your_neon_database_url"
  AI_SERVICE_URL: http://ai_service:5001
  OLLAMA_HOST: host.docker.internal:11434
  WARMUP_ON_START: "true"
```

### 2. Container Startup Sequence
1. **AI Service Container** starts with automatic warmup
2. **Frontend Container** connects to AI service
3. **Model warmup** happens automatically if Ollama is available

## Warmup Features

### Automatic Warmup on Container Start
- Enabled with `WARMUP_ON_START=true`
- Attempts warmup 3 times with 10-second intervals
- Uses legal document context for better performance

### Manual Warmup Options

#### 1. CLI Warmup (Host Machine)
```bash
node warmup-model.js
```

#### 2. API Warmup (Container)
```bash
# Test warmup from container
docker exec legal-ai-service curl -X POST http://localhost:5001/warmup/auto
```

#### 3. Frontend Warmup
```bash
# Test frontend warmup API
curl -X POST http://localhost:5000/api/warmup
```

## Docker Commands

### Build and Start with Warmup
```bash
./docker-rebuild.sh
```

### Test Warmup System
```bash
./docker-warmup-test.sh
```

### Monitor Warmup Process
```bash
# Watch AI service logs
docker-compose logs -f ai_service

# Watch frontend logs
docker-compose logs -f frontend
```

## Troubleshooting

### Ollama Connection Issues
1. **Ensure Ollama is running on host:**
   ```bash
   ollama serve
   ollama pull mistral:latest
   ```

2. **Check Docker host connectivity:**
   ```bash
   docker exec legal-ai-service curl http://host.docker.internal:11434/api/tags
   ```

### Warmup Failures
1. **Check AI service health:**
   ```bash
   curl http://localhost:5001/health
   ```

2. **Manual warmup test:**
   ```bash
   curl -X POST http://localhost:5001/warmup/auto
   ```

3. **Container restart:**
   ```bash
   docker-compose restart ai_service
   ```

## Performance Benefits

- **Cold Start Elimination**: Model loads before first document upload
- **Legal Context**: Warmup uses immigration law examples for better performance
- **Docker Optimization**: Container-aware networking and timeouts
- **Automatic Retry**: Built-in retry logic for reliable warmup

## Container Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   AI Service    │────│   Ollama        │
│   Port: 5000    │    │   Port: 5001    │    │   Port: 11434   │
│                 │    │   + Warmup      │    │   (Host)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼─────────────────┐
                                 │                 │
                    ┌─────────────────┐           │
                    │   Neon Database │           │
                    │   (External)    │           │
                    └─────────────────┘           │
                                                  │
                              Legal Documents ────┘
                              (./Legal_docs)
```

This system ensures your legal document analysis is fast and ready for production use in Docker environments.