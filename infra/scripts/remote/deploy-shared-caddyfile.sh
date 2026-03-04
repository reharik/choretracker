#!/usr/bin/env bash
set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET env var is required}"
: "${AWS_REGION:?AWS_REGION env var is required}"

echo "Deploying shared Caddyfile..."

mkdir -p /opt/shared

old_hash=""
if [[ -f /opt/shared/Caddyfile ]]; then
  old_hash="$(sha256sum /opt/shared/Caddyfile | awk '{print $1}')"
fi

tmp="$(mktemp)"
aws s3 cp "s3://${S3_BUCKET}/deployments/shared/Caddyfile" "$tmp" --region "${AWS_REGION}"

new_hash="$(sha256sum "$tmp" | awk '{print $1}')"

if [[ -n "$old_hash" && "$old_hash" == "$new_hash" ]]; then
  echo "Caddyfile unchanged ($new_hash); skipping reload."
  rm -f "$tmp"
  exit 0
fi

sudo install -m 0644 "$tmp" /opt/shared/Caddyfile
rm -f "$tmp"
echo "Caddyfile updated ($old_hash -> $new_hash)"

# Ensure shared-proxy is running (create if missing)
if docker ps -a --format '{{.Names}}' | grep -q '^shared-proxy$'; then
  if ! docker ps --format '{{.Names}}' | grep -q '^shared-proxy$'; then
    echo "Starting shared-proxy..."
    docker start shared-proxy
  fi
else
  echo "Creating shared-proxy..."
  docker run -d \
    --name shared-proxy \
    --restart unless-stopped \
    --network host \
    -v /opt/shared/Caddyfile:/etc/caddy/Caddyfile:ro \
    -v /opt/network/frontend:/srv/network:ro \
    -v /opt/chore-tracker/frontend:/srv/chore-tracker:ro \
    -v caddy_data_shared:/data \
    -v caddy_config_shared:/config \
    caddy:2-alpine
fi

echo "Reloading Caddy..."
docker exec shared-proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
