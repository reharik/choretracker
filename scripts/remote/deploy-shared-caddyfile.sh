#!/usr/bin/env bash
set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET env var is required}"

echo "Deploying shared Caddyfile..."

# Create shared directory if it doesn't exist
mkdir -p /opt/shared

# Download shared Caddyfile from S3
aws s3 cp "s3://${S3_BUCKET}/deployments/shared/Caddyfile" /opt/shared/Caddyfile

echo "Shared Caddyfile deployed to /opt/shared/Caddyfile"

# Reload shared proxy if it's running (Docker container)
if docker ps --format '{{.Names}}' | grep -q '^shared-proxy$'; then
  echo "Reloading shared proxy..."
  docker exec shared-proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
fi
