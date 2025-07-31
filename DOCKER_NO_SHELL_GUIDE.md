# Docker Warmup System (No Shell Scripts)

## Overview
The Legal AI platform now uses pure Docker configurations with Python daemons and supervisor for process management - no shell scripts required.

## Architecture

### AI Service Container
- **Supervisor**: Manages Flask app + warmup daemon
- **Flask App**: Main AI service process (auto-restart)
- **Warmup Daemon**: One-time warmup process on container start
- **Python-only**: No bash scripts, pure Python implementation

### Frontend Container
- **Built-in startup script**: Created directly in Dockerfile using RUN commands
- **Service detection**: Waits for AI service before starting
- **Zero external scripts**: Everything embedded in container

## Container Process Management

### AI Service (ai_service/Dockerfile)
```dockerfile
FROM python:3.11-slim
# ... dependencies ...

# Supervisor configuration created via RUN commands
RUN echo '[program:flask_app]' > /etc/supervisor/conf.d/supervisord.conf
RUN echo 'command=python app.py' >> /etc/supervisor/conf.d/supervisord.conf

# Warmup daemon runs once at startup
RUN echo '[program:warmup_service]' >> /etc/supervisor/conf.d/supervisord.conf
RUN echo 'command=python warmup_daemon.py' >> /etc/supervisor/conf.d/supervisord.conf

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

### Frontend (Dockerfile)
```dockerfile
# Startup script created directly in Dockerfile
RUN echo '#!/bin/bash' > /app/docker-start.sh && \
    echo 'if [ "$WARMUP_ON_START" = "true" ]; then' >> /app/docker-start.sh && \
    echo '  # Wait for AI service...' >> /app/docker-start.sh && \
    echo 'fi' >> /app/docker-start.sh && \
    chmod +x /app/docker-start.sh

CMD ["/app/docker-start.sh"]
```

## Python Warmup Components

### 1. warmup_util.py
- **Pure Python**: No external dependencies on shell
- **Direct Ollama API**: Bypasses Flask for faster warmup
- **Configurable**: Environment-aware host detection
- **Retries**: Built-in retry logic with backoff

### 2. warmup_daemon.py
- **Supervisor managed**: Runs as separate process
- **Service detection**: Waits for Flask to be ready
- **One-shot**: Runs once then exits
- **Logging**: Comprehensive startup logging

## Environment Variables

```yaml
# docker-compose.yml
ai_service:
  environment:
    OLLAMA_HOST: host.docker.internal:11434
    WARMUP_ON_START: "true"

frontend:
  environment:
    AI_SERVICE_URL: http://ai_service:5001
    WARMUP_ON_START: "true"
```

## Process Flow

1. **Container Start**: Supervisor starts both Flask and warmup daemon
2. **Warmup Daemon**: Waits for Flask health check
3. **Direct Warmup**: Calls Ollama API directly (no Flask proxy)
4. **Legal Context**: Uses immigration law examples for warmup
5. **Daemon Exit**: Warmup daemon completes and exits
6. **Flask Continue**: Main service remains running

## Benefits

- ✅ **No Shell Scripts**: Pure Docker + Python implementation
- ✅ **Process Isolation**: Supervisor manages independent processes
- ✅ **Faster Startup**: Direct Ollama API calls (no Flask proxy)
- ✅ **Container Native**: All logic embedded in Dockerfiles
- ✅ **Robust Error Handling**: Python exception handling vs shell errors
- ✅ **Better Logging**: Structured Python logging vs shell output

## Monitoring

### Check Container Processes
```bash
# View running processes in AI service
docker exec legal-ai-service ps aux

# View supervisor status
docker exec legal-ai-service supervisorctl status

# View warmup logs
docker-compose logs ai_service | grep warmup
```

### Manual Testing
```bash
# Test warmup utility directly
docker exec legal-ai-service python warmup_util.py

# Test Flask endpoints
curl http://localhost:5001/health
curl -X POST http://localhost:5001/warmup/auto
```

## Troubleshooting

### Supervisor Issues
```bash
# Restart supervisor processes
docker exec legal-ai-service supervisorctl restart all

# Check supervisor logs
docker exec legal-ai-service supervisorctl tail -f flask_app
```

### Ollama Connectivity
```bash
# Test from container
docker exec legal-ai-service python -c "
import requests
print(requests.get('http://host.docker.internal:11434/api/tags').json())
"
```

This architecture eliminates all shell script dependencies while maintaining robust AI model warmup functionality in Docker containers.