# Shared Proxy Setup for Multiple Apps

## Problem

You can't have two separate Caddy proxies both listening on ports 80/443 for different subdomains. Currently:

- Network's Caddy listens on ports 80/443
- ChoreTracker's Caddy listens on ports 8080/8443
- When you visit `chores.backintouch.net:443`, it hits Network's Caddy which doesn't know about ChoreTracker

## Solution: Single Shared Caddy Proxy

### Option 1: Standalone Caddy Container (Recommended)

1. **On EC2, create shared directory**:

```bash
sudo mkdir -p /opt/shared
sudo chown ec2-user:ec2-user /opt/shared
```

2. **Copy the shared Caddyfile**:

```bash
# From your local machine
scp Caddyfile.shared ec2-user@<ec2-ip>:/opt/shared/Caddyfile
```

3. **Stop individual proxy containers**:

```bash
# Stop Network proxy
cd /opt/network
docker compose -p network -f docker-compose.prod.yml stop proxy

# Stop ChoreTracker proxy
cd /opt/chore-tracker
docker compose -p chore-tracker -f docker-compose.prod.yml stop proxy
```

4. **Start shared Caddy proxy**:

```bash
docker run -d \
  --name shared-proxy \
  --restart unless-stopped \
  --network host \
  -v /opt/shared/Caddyfile:/etc/caddy/Caddyfile:ro \
  -v /opt/network/frontend:/srv/network:ro \
  -v /opt/chore-tracker/frontend:/srv/chore-tracker:ro \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:2-alpine
```

5. **Update docker-compose files** to remove proxy services (optional, for future deploys)

### Option 2: Use Network's Caddy, Update Caddyfile

1. **Update Network's Caddyfile** to include ChoreTracker routes:

```bash
# Edit /opt/network/Caddyfile on EC2
# Add the chores.backintouch.net section from Caddyfile.shared
```

2. **Mount ChoreTracker frontend** in Network's proxy:

```bash
# Edit /opt/network/docker-compose.prod.yml
# Add to proxy volumes:
#   - /opt/chore-tracker/frontend:/srv/chore-tracker:ro
```

3. **Restart Network proxy**:

```bash
cd /opt/network
docker compose -p network -f docker-compose.prod.yml restart proxy
```

4. **Stop ChoreTracker proxy**:

```bash
cd /opt/chore-tracker
docker compose -p chore-tracker -f docker-compose.prod.yml stop proxy
```

## Verification

After setup, test both apps:

```bash
# Network
curl -I https://backintouch.net
curl https://backintouch.net/api/health

# ChoreTracker
curl -I https://chores.backintouch.net
curl https://chores.backintouch.net/api/health
```

## DNS Setup

Make sure your DNS has:

```
A    backintouch.net           → <ec2-ip>
A    www.backintouch.net       → <ec2-ip>
A    chores.backintouch.net    → <ec2-ip>
```

## Automatic HTTPS

Caddy will automatically obtain SSL certificates from Let's Encrypt for all domains.

## Future Deployments

After frontend deployments, restart the shared proxy to pick up new files:

```bash
docker restart shared-proxy
```

Or if using Network's proxy:

```bash
cd /opt/network
docker compose -p network -f docker-compose.prod.yml restart proxy
```
