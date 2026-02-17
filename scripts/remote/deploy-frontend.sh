#!/usr/bin/env bash
set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET env var is required}"
: "${APP_NAME:?APP_NAME env var is required}"

aws s3 cp "s3://${S3_BUCKET}/deployments/${APP_NAME}/frontend-latest.tar.gz" /tmp/frontend.tar.gz
aws s3 cp "s3://${S3_BUCKET}/deployments/${APP_NAME}/Caddyfile" /tmp/Caddyfile

rm -f /opt/chore-tracker/Caddyfile
mv /tmp/Caddyfile /opt/chore-tracker/Caddyfile

rm -rf /opt/chore-tracker/frontend
mkdir -p /opt/chore-tracker/frontend
tar -xzf /tmp/frontend.tar.gz -C /opt/chore-tracker/frontend
rm -f /tmp/frontend.tar.gz

# Fix permissions so Caddy can read the files
chmod -R 755 /opt/chore-tracker/frontend
find /opt/chore-tracker/frontend -type f -exec chmod 644 {} \;

echo "Frontend files deployed to /opt/chore-tracker/frontend"

# Reload shared proxy if it exists (will be set up by setup-shared-proxy.sh)
if docker ps --format '{{.Names}}' | grep -q '^shared-proxy$'; then
  echo "Reloading shared proxy..."
  docker exec shared-proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || echo "Note: Proxy reload failed, will be set up by setup-shared-proxy.sh"
else
  echo "Shared proxy not running yet, will be started by setup-shared-proxy.sh"
fi

echo "Frontend deployed."
