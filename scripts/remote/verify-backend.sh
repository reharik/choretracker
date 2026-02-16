#!/usr/bin/env bash
set -euo pipefail

: "${APP_NAME:=chore-tracker}"

cd /opt/chore-tracker
docker compose -p "${APP_NAME}" -f docker-compose.prod.yml ps

echo "Checking API health..."
max_attempts=30
for i in $(seq 1 $max_attempts); do
  if curl -sf http://localhost:3001/health >/dev/null 2>&1; then
    echo "✓ API is healthy"
    exit 0
  fi
  echo "Attempt $i/$max_attempts: waiting for API..."
  sleep 2
done

echo "ERROR: API health check failed after $max_attempts attempts"
docker compose -p "${APP_NAME}" -f docker-compose.prod.yml logs --tail=200 || true
exit 1
