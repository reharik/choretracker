# Docker Quick Start for ChoreTracker

## Issue Encountered

The Docker dev environment failed because `awilix` package wasn't found. This happens because:

1. Dependencies need to be installed on the host machine first
2. Docker volume mounts the local `node_modules` into the container
3. Without local dependencies, the container has nothing to mount

## Solution: Install Dependencies First

### Step 1: Install Dependencies on Host

```bash
cd /home/reharik/Development/ChoreTracker
npm install
```

This will install all dependencies including:

- `awilix` (DI container)
- `koa` and related packages
- `knex` and `pg` (database)
- `winston` (logging)
- All other dependencies

### Step 2: Start Docker Development Environment

```bash
make dev-up
# or
docker compose -f docker-compose-dev.yml up -d
```

### Step 3: Run Database Migrations

```bash
npm run db:migrate
```

### Step 4: Check Status

```bash
# View container status
docker compose -f docker-compose-dev.yml ps

# View API logs
docker compose -f docker-compose-dev.yml logs api -f

# Test health endpoint
curl http://localhost:3000/health
```

## Docker Development Workflow

### Starting Services

```bash
make dev-up
```

### Stopping Services

```bash
make dev-down
```

### Viewing Logs

```bash
make dev-logs
# or for specific service
docker compose -f docker-compose-dev.yml logs api -f
docker compose -f docker-compose-dev.yml logs db -f
```

### Rebuilding After Dependency Changes

```bash
# Stop containers
make dev-down

# Install new dependencies on host
npm install

# Rebuild and start
docker compose -f docker-compose-dev.yml up -d --build
```

## Alternative: Run Without Docker

If you prefer to run without Docker for development:

### Terminal 1: Start PostgreSQL

```bash
# Using Docker just for database
docker run -d \
  --name chore-tracker-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=chore_tracker \
  -p 5432:5432 \
  postgres:16-alpine
```

### Terminal 2: Run API

```bash
cd /home/reharik/Development/ChoreTracker
npm run dev:api
```

### Terminal 3: Run Web

```bash
cd /home/reharik/Development/ChoreTracker
npm run dev:web
```

## Environment Variables

The `.env` file has been created at `api/.env` with:

- Database connection to Docker PostgreSQL
- JWT secret (change in production!)
- CORS origin for local development
- Debug logging level

## Current Status

✅ Docker Compose files created
✅ Dockerfile created
✅ Makefile created
✅ .env file created
⏳ Dependencies need to be installed: `npm install`
⏳ Database migrations need to be run: `npm run db:migrate`

## Next Steps

1. Run `npm install` in the project root
2. Run `make dev-up` to start Docker containers
3. Run `npm run db:migrate` to set up database
4. Access API at http://localhost:3000
5. Access Web at http://localhost:5173 (when started)
