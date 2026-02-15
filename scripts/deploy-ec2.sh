#!/usr/bin/env bash
set -euo pipefail

cd /opt/chore-tracker

echo "Starting EC2 deploy at $(date)"

if [ ! -d /opt/chore-tracker/deploy ]; then
  echo "ERROR: /opt/chore-tracker/deploy does not exist"
  exit 1
fi

if [ ! -f /opt/chore-tracker/deploy/chore-tracker-api.tar.gz ]; then
  echo "ERROR: /opt/chore-tracker/deploy/chore-tracker-api.tar.gz not found"
  exit 1
fi

if [ ! -f /opt/chore-tracker/docker-compose.prod.yml ]; then
  echo "ERROR: /opt/chore-tracker/docker-compose.prod.yml not found"
  exit 1
fi

echo "Loading Docker image"
gunzip -c /opt/chore-tracker/deploy/chore-tracker-api.tar.gz | docker load

echo "Starting services via docker compose"
docker compose --env-file /opt/chore-tracker/env/prod.env --project-directory /opt/chore-tracker -f /opt/chore-tracker/docker-compose.prod.yml up -d

echo "Running database migrations"
docker compose --env-file /opt/chore-tracker/env/prod.env --project-directory /opt/chore-tracker -f /opt/chore-tracker/docker-compose.prod.yml exec -T api sh -c "cd /app && npx knex --knexfile api/dist/knexfile.js migrate:latest"

echo "Running containers:"
docker compose --env-file /opt/chore-tracker/env/prod.env --project-directory /opt/chore-tracker -f /opt/chore-tracker/docker-compose.prod.yml ps

echo "Deploy complete"
