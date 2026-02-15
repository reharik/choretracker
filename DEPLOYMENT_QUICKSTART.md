# ChoreTracker - Deployment Quick Start

## One-Time Setup (5 minutes)

### 1. On EC2 Instance

```bash
# Create directories
sudo mkdir -p /opt/chore-tracker/{env,deploy,backups,frontend}
sudo chown -R $USER:$USER /opt/chore-tracker

# Create environment file
cat > /opt/chore-tracker/env/prod.env << 'EOF'
NODE_ENV=production
PORT=3000
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=chore_tracker
JWT_SECRET=$(openssl rand -base64 64)
CORS_ORIGIN=http://YOUR_EC2_IP
EOF

# Edit and update CORS_ORIGIN
nano /opt/chore-tracker/env/prod.env
```

### 2. From Local Machine

```bash
# Copy deployment files
scp docker-compose.prod.yml user@ec2:/opt/chore-tracker/
scp Caddyfile user@ec2:/opt/chore-tracker/
scp scripts/*.sh user@ec2:/opt/chore-tracker/
ssh user@ec2 "chmod +x /opt/chore-tracker/*.sh"
```

## Deploy (Every time you update)

### Build & Deploy

```bash
# 1. Build Docker image for ARM64
docker buildx build --platform linux/arm64 \
  -f api/Dockerfile --target production \
  -t chore-tracker-api:latest --load .

# 2. Save and copy to EC2
docker save chore-tracker-api:latest | gzip > chore-tracker-api.tar.gz
scp chore-tracker-api.tar.gz user@ec2:/opt/chore-tracker/deploy/

# 3. Build and copy frontend
npm run build --workspace=@app/web
tar -czf frontend.tar.gz -C web/dist .
scp frontend.tar.gz user@ec2:/opt/chore-tracker/

# 4. Deploy on EC2
ssh user@ec2 << 'ENDSSH'
cd /opt/chore-tracker
gunzip -c deploy/chore-tracker-api.tar.gz | docker load
docker compose --env-file env/prod.env -f docker-compose.prod.yml up -d
docker compose --env-file env/prod.env -f docker-compose.prod.yml exec -T api \
  sh -c "cd /app && npx knex --knexfile api/dist/knexfile.js migrate:latest"
tar -xzf frontend.tar.gz -C frontend/
ENDSSH
```

## Verify

```bash
ssh user@ec2 "curl http://localhost:3000/health"
curl http://YOUR_EC2_IP/api/health
```

## Common Commands

```bash
# View logs
ssh user@ec2 "docker compose -f /opt/chore-tracker/docker-compose.prod.yml logs -f"

# Restart services
ssh user@ec2 "docker compose -f /opt/chore-tracker/docker-compose.prod.yml restart"

# Backup database
ssh user@ec2 "/opt/chore-tracker/backup-db.sh"

# Check status
ssh user@ec2 "docker compose -f /opt/chore-tracker/docker-compose.prod.yml ps"
```

## Sharing EC2 with Network App

Update ports in `docker-compose.prod.yml`:

```yaml
api:
  ports:
    - '127.0.0.1:3001:3000'  # Use 3001 instead of 3000

proxy:
  ports:
    - '8080:80'    # Use 8080 instead of 80
    - '8443:443'   # Use 8443 instead of 443
```

Update Caddyfile to use different ports or domains.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API not responding | `docker logs chore-tracker-api` |
| Database connection failed | Check `env/prod.env` and `docker logs chore-tracker-db` |
| Frontend not loading | Check `ls -la /opt/chore-tracker/frontend/` |
| Port already in use | Change ports in `docker-compose.prod.yml` |

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
