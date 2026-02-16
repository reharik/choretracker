# ChoreTracker - EC2 Deployment Guide

This guide will help you deploy ChoreTracker to the same EC2 instance as the Network app, using the same deployment infrastructure.

## Prerequisites

- AWS EC2 instance (t4g.micro ARM64 or t3.micro x86_64)
- Docker and Docker Compose installed on EC2
- AWS CLI configured
- GitHub repository for CI/CD (optional)

## Quick Start

### 1. Prepare EC2 Instance

SSH into your EC2 instance and create the application directory:

```bash
sudo mkdir -p /opt/chore-tracker/{env,deploy,backups,frontend}
sudo chown -R $USER:$USER /opt/chore-tracker
```

### 2. Configure Environment Variables

Create `/opt/chore-tracker/env/prod.env` on your EC2 instance:

```bash
# Copy the sample file as a starting point
cat > /opt/chore-tracker/env/prod.env << 'EOF'
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=chore_tracker

# JWT Secret (generate with: openssl rand -base64 64)
JWT_SECRET=CHANGE_ME_GENERATE_STRONG_SECRET

# CORS (your production URL)
CORS_ORIGIN=http://YOUR_EC2_IP_OR_DOMAIN
EOF
```

**IMPORTANT**: Update the following values:

- `POSTGRES_PASSWORD`: Use a strong password
- `JWT_SECRET`: Generate with `openssl rand -base64 64`
- `CORS_ORIGIN`: Your actual EC2 IP or domain

### 3. Copy Deployment Files to EC2

From your local machine:

```bash
# Copy docker-compose and Caddyfile
scp docker-compose.prod.yml user@your-ec2:/opt/chore-tracker/
scp Caddyfile user@your-ec2:/opt/chore-tracker/

# Copy backup script (optional, for manual backups)
scp scripts/backup-db.sh user@your-ec2:/opt/chore-tracker/scripts/
ssh user@your-ec2 "chmod +x /opt/chore-tracker/scripts/backup-db.sh"
```

**Note**: The `scripts/remote/` directory and `deploy-ec2.sh` are automatically deployed via GitHub Actions. They don't need to be manually copied.

### 4. Build and Deploy Docker Image

#### Option A: Build on EC2 (Simpler)

```bash
# On your local machine, build for ARM64
docker buildx build --platform linux/arm64 \
  -f api/Dockerfile \
  --target production \
  -t chore-tracker-api:latest \
  --load .

# Save and compress
docker save chore-tracker-api:latest | gzip > chore-tracker-api.tar.gz

# Copy to EC2
scp chore-tracker-api.tar.gz user@your-ec2:/opt/chore-tracker/deploy/

# On EC2, load and start
ssh user@your-ec2
cd /opt/chore-tracker
gunzip -c deploy/chore-tracker-api.tar.gz | docker load
docker compose --env-file env/prod.env -f docker-compose.prod.yml up -d
```

#### Option B: Use GitHub Actions (Automated)

See the "GitHub Actions Setup" section below for automated deployments.

### 5. Run Database Migrations

```bash
# On EC2
cd /opt/chore-tracker
docker compose --env-file env/prod.env -f docker-compose.prod.yml exec -T api \
  sh -c "cd /app && npx knex --knexfile api/dist/knexfile.js migrate:latest"
```

### 6. Build and Deploy Frontend

```bash
# On your local machine
npm run build --workspace=@app/web

# Package frontend
tar -czf frontend.tar.gz -C web/dist .

# Copy to EC2
scp frontend.tar.gz user@your-ec2:/opt/chore-tracker/

# On EC2, extract
ssh user@your-ec2
cd /opt/chore-tracker
tar -xzf frontend.tar.gz -C frontend/
```

### 7. Verify Deployment

```bash
# Check running containers
docker compose -f /opt/chore-tracker/docker-compose.prod.yml ps

# Check API health
curl http://localhost:3000/health

# Check via proxy
curl http://YOUR_EC2_IP/api/health
```

## Configuration

### Caddyfile Configuration

The default `Caddyfile` is configured for IP-based access (HTTP only). To enable HTTPS with a domain:

1. Edit `/opt/chore-tracker/Caddyfile`
2. Uncomment the domain block and replace `choretracker.example.com` with your domain
3. Comment out the `:80` block
4. Restart the proxy: `docker compose -f /opt/chore-tracker/docker-compose.prod.yml restart proxy`

### Database Backups

Set up automated daily backups:

```bash
# Add to crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /opt/chore-tracker/backup-db.sh >> /opt/chore-tracker/backups/backup.log 2>&1
```

Optional: Configure S3 backups by setting `S3_BACKUP_BUCKET` environment variable.

### Restore from Backup

```bash
cd /opt/chore-tracker
gunzip < backups/chore_tracker_db_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db \
  psql -U postgres chore_tracker
```

## GitHub Actions Setup (Optional)

For automated deployments on every push to `main`:

### 1. Required AWS Setup

- Create an S3 bucket for deployment artifacts
- Create an IAM role for GitHub OIDC authentication
- Tag your EC2 instance: `App=chore-tracker`, `Env=prod`
- Install AWS Systems Manager Agent on EC2

### 2. Required GitHub Secrets

Add these secrets to your GitHub repository:

```
AWS_ROLE_ARN: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsDeployRole
AWS_REGION: us-east-1
S3_BUCKET: your-deployment-bucket
```

### 3. Create GitHub Actions Workflow

Copy the deployment workflow from the Network app and adapt it:

```bash
mkdir -p .github/workflows
# Copy and modify the deploy-ec2.yml from ~/Development/network/.github/workflows/
```

Key changes needed:

- Replace `network` with `chore-tracker` throughout
- Update S3 paths
- Update SSM tag targeting (`SSM_TAG_APP: chore-tracker`)

## Sharing EC2 with Network App

Both apps can run on the same EC2 instance. Key considerations:

### Port Allocation

- **Network**: API on 3000, Proxy on 80/443
- **ChoreTracker**: API on 3001, Proxy on 8080/8443

Update `docker-compose.prod.yml` for ChoreTracker:

```yaml
api:
  ports:
    - '127.0.0.1:3001:3000' # Changed from 3000

proxy:
  ports:
    - '8080:80' # Changed from 80
    - '8443:443' # Changed from 443
```

### Caddyfile for Multiple Apps

Use a single Caddy instance with multiple domains:

```caddyfile
# Network app
network.example.com {
  handle /api/* {
    reverse_proxy localhost:3000
  }
  handle {
    root * /opt/network/frontend
    file_server
    try_files {path} /index.html
  }
}

# ChoreTracker app
choretracker.example.com {
  handle /api/* {
    reverse_proxy localhost:3001
  }
  handle {
    root * /opt/chore-tracker/frontend
    file_server
    try_files {path} /index.html
  }
}
```

## Troubleshooting

### Check Logs

```bash
# All services
docker compose -f /opt/chore-tracker/docker-compose.prod.yml logs

# Specific service
docker compose -f /opt/chore-tracker/docker-compose.prod.yml logs api
docker compose -f /opt/chore-tracker/docker-compose.prod.yml logs db
docker compose -f /opt/chore-tracker/docker-compose.prod.yml logs proxy
```

### Restart Services

```bash
cd /opt/chore-tracker
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml restart proxy
```

### Database Connection Issues

```bash
# Check if database is running
docker compose -f /opt/chore-tracker/docker-compose.prod.yml exec db pg_isready -U postgres

# Check database logs
docker compose -f /opt/chore-tracker/docker-compose.prod.yml logs db
```

### API Not Responding

```bash
# Check if API container is running
docker ps | grep chore-tracker-api

# Check API logs
docker logs chore-tracker-api

# Test API directly
curl http://localhost:3000/health
```

## Cost Estimate

Running both Network and ChoreTracker on the same EC2 instance:

- **EC2 t4g.micro**: ~$6-8/month (free tier eligible for 12 months)
- **EBS Storage**: ~$2-3/month (30GB)
- **Data Transfer**: Usually free (1GB/month free tier)
- **Total**: ~$8-12/month (or $0-5/month with free tier)

## Security Checklist

- [ ] Strong `POSTGRES_PASSWORD` set
- [ ] Strong `JWT_SECRET` generated
- [ ] `CORS_ORIGIN` set to production URL only
- [ ] Database not exposed externally (only bound to Docker network)
- [ ] API only bound to localhost (127.0.0.1)
- [ ] HTTPS enabled if using a domain
- [ ] Regular database backups configured
- [ ] EC2 security group properly configured
- [ ] IAM roles used instead of hardcoded AWS credentials

## Next Steps

1. Set up monitoring (CloudWatch, health checks)
2. Configure domain and SSL (if needed)
3. Set up automated backups
4. Configure GitHub Actions for CI/CD
5. Set up log aggregation (CloudWatch Logs)

## Support

For issues or questions:

- Check logs: `docker compose logs`
- Review Network app deployment for reference
- Check AWS Systems Manager for SSM-based deployments

---

**Template Source**: This deployment setup is based on the Network app deployment architecture. For more detailed examples and scripts, refer to `~/Development/network/docs/deployment-ec2.md`.
