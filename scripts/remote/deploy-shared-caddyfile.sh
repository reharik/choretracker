needs_reload=0

# ... compute old_hash/new_hash ...

if [[ -z "$old_hash" || "$old_hash" != "$new_hash" ]]; then
  sudo install -m 0644 "$tmp" /opt/shared/Caddyfile
  needs_reload=1
else
  echo "Caddyfile unchanged; will not reload."
fi

# ALWAYS ensure container exists/running
if docker ps -a --format '{{.Names}}' | grep -q '^shared-proxy$'; then
  docker ps --format '{{.Names}}' | grep -q '^shared-proxy$' || docker start shared-proxy
else
  docker run -d \
    --name shared-proxy \
    --restart unless-stopped \
    --network host \
    -v /opt/shared/Caddyfile:/etc/caddy/Caddyfile:ro \
    -v /opt/network/frontend:/srv/network:ro \
    -v /opt/chore-tracker/frontend:/srv/chore-tracker:ro \
    -v caddy_data_shared:/data \
    -v caddy_config_shared:/data \
    caddy:2-alpine
fi

# Reload only when changed (or if you prefer: always reload, cheap)
if [[ "$needs_reload" -eq 1 ]]; then
  docker exec shared-proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
fi
