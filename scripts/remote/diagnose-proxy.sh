#!/usr/bin/env bash
set -euo pipefail

echo "=== Proxy Diagnostics ==="
echo ""

echo "1. Docker containers:"
docker ps -a | grep -E 'proxy|caddy' || echo "No proxy containers found"
echo ""

echo "2. Shared proxy status:"
if docker ps --format '{{.Names}}' | grep -q '^shared-proxy$'; then
  echo "✓ Shared proxy is running"
  docker ps --filter "name=shared-proxy" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
  echo "✗ Shared proxy is NOT running"
fi
echo ""

echo "3. Caddyfile location:"
ls -lh /opt/shared/Caddyfile 2>/dev/null || echo "✗ /opt/shared/Caddyfile not found"
echo ""

echo "4. Frontend directories:"
ls -lh /opt/network/frontend/ 2>/dev/null | head -5 || echo "✗ /opt/network/frontend not found"
echo ""
ls -lh /opt/chore-tracker/frontend/ 2>/dev/null | head -5 || echo "✗ /opt/chore-tracker/frontend not found"
echo ""

echo "5. API health checks:"
echo "Network API (port 3000):"
curl -sf http://localhost:3000/health 2>/dev/null && echo "✓ Network API healthy" || echo "✗ Network API not responding"
echo ""
echo "ChoreTracker API (port 3001):"
curl -sf http://localhost:3001/health 2>/dev/null && echo "✓ ChoreTracker API healthy" || echo "✗ ChoreTracker API not responding"
echo ""

echo "6. Caddy logs (last 30 lines):"
docker logs shared-proxy 2>&1 | tail -30 || echo "✗ Cannot get logs"
echo ""

echo "7. Test Caddy config:"
docker exec shared-proxy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1 || echo "✗ Config validation failed"
