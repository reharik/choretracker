#!/bin/sh
set -e
# Use NODE_ENV from environment, default to production if not set
export NODE_ENV=${NODE_ENV:-development}
cd /app/apps/api/dist
node scripts/runMigrations.js || true
node scripts/runSeeds.js || true
node index.js
