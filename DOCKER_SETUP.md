# Docker Setup for Legal AI Platform

## Quick Start

1. **Rebuild containers with your database**:
   ```bash
   ./docker-rebuild.sh
   ```

2. **Check container status**:
   ```bash
   docker-compose ps
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f frontend
   docker-compose logs -f ai_service
   ```

## Configuration

- **Database**: Uses your Neon database (configured in docker-compose.yml)
- **Frontend**: Runs on http://localhost:5000
- **AI Service**: Runs on http://localhost:5001 
- **Legal Docs**: Mounted from `./Legal_docs` folder

## Troubleshooting

### Database Connection Issues
- Ensure your Neon database is accessible
- Check DATABASE_URL in docker-compose.yml

### Container Won't Start
```bash
docker-compose down --remove-orphans
docker system prune -f
./docker-rebuild.sh
```

### Upload Issues
- Check frontend logs: `docker-compose logs frontend`
- Verify Legal_docs folder is mounted correctly

## Development vs Production

For development, continue using:
```bash
npm run dev
```

For production testing with Docker:
```bash
docker-compose up --build
```