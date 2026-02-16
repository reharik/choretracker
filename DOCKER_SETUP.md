# Docker Setup for ChoreTracker

This document describes the Docker and docker-compose configuration for the ChoreTracker application.

## Files Created

### Docker Files

1. **api/Dockerfile** - Multi-stage Dockerfile for the API
   - `base` - Base image with Node.js 22
   - `deps-dev-staging` - Development and staging dependencies
   - `deps-prod` - Production dependencies only
   - `build` - Build stage for production
   - `dev` - Development runtime with hot reloading
   - `production` - Production runtime (minimal, optimized)
   - `staging` - Staging/CI runtime

### Docker Compose Files

1. **docker-compose.yml** - Production configuration
   - PostgreSQL database
   - API service
   - Health checks
   - Volume management

2. **docker-compose-dev.yml** - Development configuration
   - PostgreSQL database (port exposed)
   - API service with hot reload
   - Volume mounts for source code
   - Development environment variables

### Makefile

Convenient commands for Docker operations:

```bash
# Production
make build      # Build production images
make up         # Start production containers
make down       # Stop production containers
make logs       # View production logs

# Development
make dev-up     # Start development containers
make dev-down   # Stop development containers
make dev-logs   # View development logs

# Maintenance
make clean      # Remove all containers and volumes
```

## Usage

### Development

Start the development environment:

```bash
make dev-up
```

This will:

- Start PostgreSQL on port 5432
- Start API on port 3000 with hot reload
- Mount source code for live updates

View logs:

```bash
make dev-logs
```

Stop development:

```bash
make dev-down
```

### Production

Build production images:

```bash
make build
```

Start production:

```bash
make up
```

View logs:

```bash
make logs
```

Stop production:

```bash
make down
```

## Environment Variables

### API (.env file)

Required environment variables for the API:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=chore_tracker

# API
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Docker Compose Services

### Database (db)

- **Image**: postgres:16-alpine
- **Ports**: 5432 (dev only)
- **Volumes**: pgdata (persistent storage)
- **Health Check**: pg_isready

### API (api)

- **Build**: From api/Dockerfile
- **Ports**: 3000:3000
- **Depends On**: db (with health check)
- **Environment**: Loaded from api/.env
- **Volumes** (dev only): Source code mounted for hot reload

## Development Workflow

1. **Start services**:

   ```bash
   make dev-up
   ```

2. **Run migrations**:

   ```bash
   npm run db:migrate
   ```

3. **Seed database** (optional):

   ```bash
   npm run db:seed
   ```

4. **View logs**:

   ```bash
   make dev-logs
   ```

5. **Make changes** - The API will automatically reload

6. **Stop services**:
   ```bash
   make dev-down
   ```

## Production Deployment

1. **Build images**:

   ```bash
   make build
   ```

2. **Start services**:

   ```bash
   make up
   ```

3. **Run migrations**:

   ```bash
   docker compose exec api npm run db:migrate:prod
   ```

4. **Check health**:
   ```bash
   curl http://localhost:3000/health
   ```

## Troubleshooting

### Port Already in Use

If you see "address already in use" errors:

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 make dev-up
```

### Database Connection Issues

Check database health:

```bash
docker compose ps
docker compose logs db
```

### Volume Issues

Clean up volumes and restart:

```bash
make clean
make dev-up
```

## Architecture Notes

### Multi-Stage Build

The Dockerfile uses multi-stage builds to:

- Separate development and production dependencies
- Minimize production image size
- Enable efficient caching
- Support multiple deployment targets

### Hot Reload

Development mode mounts source code as volumes:

- Changes to source files trigger automatic reload
- No need to rebuild images during development
- node_modules excluded from mount for performance

### Health Checks

Services include health checks:

- Database: `pg_isready` command
- API: `/health` endpoint
- Ensures services are ready before dependent services start

## Template Source

All Docker configuration was created based on:
`/home/reharik/Development/network`

The network application uses similar patterns for containerization and orchestration.
