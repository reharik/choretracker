#!/usr/bin/env bash
set -euo pipefail

echo "Setting up shared Caddy proxy..."

# Check if shared proxy already exists and is running
if docker ps -a --format '{{.Names}}' | grep -q '^shared-proxy$'; then
  echo "Shared proxy container already exists"
  
  # Check if it's running
  if docker ps --format '{{.Names}}' | grep -q '^shared-proxy$'; then
    echo "Shared proxy is already running"
  else
    echo "Starting existing shared proxy..."
    docker start shared-proxy
  fi
else
  echo "Creating shared proxy container..."
  
  # Create shared directory if it doesn't exist
  mkdir -p /opt/shared
  
  # Create volumes if they don't exist
  docker volume create caddy_data_shared 2>/dev/null || true
  docker volume create caddy_config_shared 2>/dev/null || true
  
  # Start shared Caddy proxy
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
  
  echo "Shared proxy created and started"
fi

# Stop individual proxy containers if they're running
echo "Stopping individual proxy containers..."

# Stop Network proxy if running
if docker ps --format '{{.Names}}' | grep -q 'network.*proxy'; then
  NETWORK_PROXY=$(docker ps --format '{{.Names}}' | grep 'network.*proxy' || true)
  if [ -n "$NETWORK_PROXY" ]; then
    echo "Stopping Network proxy: $NETWORK_PROXY"
    docker stop "$NETWORK_PROXY" || true
  fi
fi

# Stop ChoreTracker proxy if running
if docker ps --format '{{.Names}}' | grep -q 'chore-tracker.*proxy'; then
  CHORE_PROXY=$(docker ps --format '{{.Names}}' | grep 'chore-tracker.*proxy' || true)
  if [ -n "$CHORE_PROXY" ]; then
    echo "Stopping ChoreTracker proxy: $CHORE_PROXY"
    docker stop "$CHORE_PROXY" || true
  fi
fi

# Restart proxy to ensure volume mounts are correct
if docker ps --format '{{.Names}}' | grep -q '^shared-proxy$'; then
  echo "Restarting shared proxy to refresh volume mounts..."
  docker restart shared-proxy
  sleep 2
  echo "Reloading Caddyfile..."
  docker exec shared-proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
fi

echo "Shared proxy setup complete"
docker ps --filter "name=shared-proxy" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verify mounts
echo ""
echo "Verifying volume mounts:"
docker exec shared-proxy ls -la /srv/network/ | head -3 || echo "✗ Network frontend not mounted"
docker exec shared-proxy ls -la /srv/chore-tracker/ | head -3 || echo "✗ ChoreTracker frontend not mounted"
