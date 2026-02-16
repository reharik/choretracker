# Shared Proxy Automatic Deployment

## What It Does

The deployment now automatically sets up a **single shared Caddy proxy** that handles both applications:

- **Network**: `https://backintouch.net` → API on port 3000
- **ChoreTracker**: `https://chores.backintouch.net` → API on port 3001

## How It Works

### During Deployment

1. **Both apps upload** `Caddyfile.shared` to S3 at `deployments/shared/Caddyfile`
2. **Frontend deployment** downloads the shared Caddyfile to `/opt/shared/Caddyfile` on EC2
3. **Setup script runs** (`scripts/remote/setup-shared-proxy.sh`):
   - Checks if `shared-proxy` container exists
   - Creates it if needed (using `--network host` to access both APIs)
   - Stops individual proxy containers from docker-compose
   - Reloads Caddyfile if proxy is already running

### Container Configuration

The shared proxy container:

```bash
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
```

### Why `--network host`?

Using `--network host` allows the proxy to access:

- Network API at `localhost:3000`
- ChoreTracker API at `localhost:3001`
- Without needing to join multiple Docker networks

## DNS Configuration

Make sure your DNS has these A records pointing to your EC2 IP:

```
backintouch.net           → <ec2-ip>
www.backintouch.net       → <ec2-ip>
chores.backintouch.net    → <ec2-ip>
```

## SSL Certificates

Caddy automatically obtains and renews SSL certificates from Let's Encrypt for:

- `backintouch.net`
- `www.backintouch.net` (redirects to backintouch.net)
- `chores.backintouch.net`

## Manual Operations

### Check Proxy Status

```bash
docker ps --filter "name=shared-proxy"
docker logs shared-proxy
```

### Restart Proxy

```bash
docker restart shared-proxy
```

### Reload Caddyfile (without restart)

```bash
docker exec shared-proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

### Update Caddyfile Manually

```bash
# Edit the file
sudo nano /opt/shared/Caddyfile

# Reload
docker exec shared-proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

### View Caddy Logs

```bash
docker logs -f shared-proxy
```

### Stop and Remove (for troubleshooting)

```bash
docker stop shared-proxy
docker rm shared-proxy

# Then redeploy to recreate it
```

## Troubleshooting

### Both domains show the same app

- Check that the Caddyfile has correct routes for both domains
- Verify frontend directories exist: `ls /opt/network/frontend /opt/chore-tracker/frontend`
- Check Caddy logs: `docker logs shared-proxy`

### SSL certificate errors

- Wait a few minutes for Let's Encrypt to issue certificates
- Check Caddy logs for ACME challenges
- Ensure ports 80 and 443 are open in EC2 security group

### API requests fail

- Verify APIs are running: `curl localhost:3000/health` and `curl localhost:3001/health`
- Check API logs: `docker logs network-api-1` and `docker logs chore-tracker-api-1`

### Container won't start

- Check if ports 80/443 are already in use: `sudo netstat -tulpn | grep ':80\|:443'`
- View container logs: `docker logs shared-proxy`
- Try removing and recreating: `docker rm -f shared-proxy` then redeploy

## Files

- **Caddyfile.shared**: Shared Caddy configuration for both apps
- **scripts/remote/setup-shared-proxy.sh**: Automatic setup script
- **docker-compose.prod.yml**: Individual proxy services are commented out
