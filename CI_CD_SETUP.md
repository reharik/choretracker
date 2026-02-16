# ChoreTracker - CI/CD Setup Complete ✅

## What Was Created

### GitHub Actions Workflows

1. **`.github/workflows/ci.yml`** - Continuous Integration
   - Runs on every push and PR
   - Jobs: Lint, Test, Build
   - Validates code quality before merge

2. **`.github/workflows/deploy-ec2.yml`** - Continuous Deployment
   - Triggers on push to `main` or manual dispatch
   - Deploys backend (Docker) and frontend (static files)
   - Uses AWS SSM for secure, SSH-less deployment

3. **`.github/workflows/README.md`** - Complete setup guide
   - AWS infrastructure requirements
   - GitHub secrets configuration
   - Troubleshooting guide

### Deployment Scripts

#### Main Scripts

- `scripts/deploy-ec2.sh` - Main deployment script (runs on EC2)
- `scripts/backup-db.sh` - Database backup automation
- `scripts/ssm-run.sh` - SSM command runner (for GitHub Actions)

#### Remote Scripts (SSM Execution)

- `scripts/remote/download-backend.sh` - Downloads artifacts from S3
- `scripts/remote/deploy-backend.sh` - Deploys backend on EC2
- `scripts/remote/verify-backend.sh` - Health check verification
- `scripts/remote/deploy-frontend.sh` - Deploys frontend on EC2

## Quick Start

### 1. AWS Setup (One-Time)

```bash
# Create S3 bucket
aws s3 mb s3://chore-tracker-deploy-YOUR_ACCOUNT_ID-us-east-1

# Tag your EC2 instance
aws ec2 create-tags --resources i-YOUR_INSTANCE_ID --tags Key=App,Value=chore-tracker Key=Env,Value=prod
```

### 2. GitHub Secrets

Add to your repository (Settings → Secrets and variables → Actions):

| Secret         | Value                                            |
| -------------- | ------------------------------------------------ |
| `AWS_ROLE_ARN` | `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole` |

### 3. Update Workflow

Edit `.github/workflows/deploy-ec2.yml`:

```yaml
env:
  S3_BUCKET: chore-tracker-deploy-YOUR_ACCOUNT_ID-us-east-1 # Update this
```

### 4. Deploy

```bash
git add .
git commit -m "Add CI/CD workflows"
git push origin main
```

GitHub Actions will automatically deploy to EC2!

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                           │
│                                                              │
│  1. Build Docker Image (ARM64)                              │
│  2. Build Frontend (React)                                  │
│  3. Upload to S3                                            │
│  4. Trigger SSM Command                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS Systems Manager                       │
│                                                              │
│  1. Download artifacts from S3                              │
│  2. Load Docker image                                       │
│  3. Start services                                          │
│  4. Run migrations                                          │
│  5. Verify health                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      EC2 Instance                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Caddy      │  │     API      │  │  PostgreSQL  │     │
│  │   Proxy      │  │   (Docker)   │  │   (Docker)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Features

### ✅ Continuous Integration

- **Automatic testing** on every push
- **Code quality checks** (lint, format)
- **Build verification** before deployment
- **Fast feedback** (~3-5 minutes)

### ✅ Continuous Deployment

- **Automatic deployment** on push to `main`
- **Manual deployment** option via GitHub UI
- **Zero-downtime** deployment
- **Automatic rollback** on health check failure
- **Database migrations** run automatically

### ✅ Security

- **OIDC authentication** (no long-lived AWS credentials)
- **SSH-less deployment** via AWS Systems Manager
- **Secrets management** via GitHub Secrets
- **Scoped IAM permissions**

### ✅ Observability

- **Real-time logs** in GitHub Actions UI
- **Health checks** after deployment
- **Automatic verification** of services
- **Deployment history** in GitHub

## Cost Estimate

| Service        | Cost                       |
| -------------- | -------------------------- |
| GitHub Actions | Free (2,000 minutes/month) |
| S3 Storage     | ~$0.50/month (artifacts)   |
| SSM Commands   | Free                       |
| **Total**      | **~$0.50/month**           |

## Comparison with Network App

| Feature        | Network | ChoreTracker | Status    |
| -------------- | ------- | ------------ | --------- |
| CI Workflow    | ✅      | ✅           | Identical |
| CD Workflow    | ✅      | ✅           | Adapted   |
| SSM Deployment | ✅      | ✅           | Same      |
| Docker Build   | ✅      | ✅           | ARM64     |
| Health Checks  | ✅      | ✅           | Same      |
| S3 Artifacts   | ✅      | ✅           | Same      |

## Manual Deployment (Alternative)

If you prefer not to use GitHub Actions:

```bash
# Build and deploy manually
docker buildx build --platform linux/arm64 -f api/Dockerfile --target production -t chore-tracker-api:latest --load .
docker save chore-tracker-api:latest | gzip > chore-tracker-api.tar.gz
scp chore-tracker-api.tar.gz user@ec2:/opt/chore-tracker/deploy/
ssh user@ec2 /opt/chore-tracker/scripts/deploy-ec2.sh
```

See [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) for details.

## Monitoring

### GitHub Actions

- View workflow runs: Repository → Actions
- Check logs: Click on any workflow run
- Re-run failed jobs: Click "Re-run jobs"

### EC2 Instance

```bash
# Check service status
docker compose -f /opt/chore-tracker/docker-compose.prod.yml ps

# View logs
docker compose -f /opt/chore-tracker/docker-compose.prod.yml logs -f

# Check health
curl http://localhost:3000/health
```

### AWS Systems Manager

- View command history: Systems Manager → Run Command → Command history
- Check instance status: Systems Manager → Fleet Manager

## Troubleshooting

See [.github/workflows/README.md](./.github/workflows/README.md) for detailed troubleshooting guide.

### Common Issues

**"SSM command timed out"**

- Check EC2 instance tags (`App=chore-tracker`, `Env=prod`)
- Verify SSM agent is running: `sudo systemctl status amazon-ssm-agent`

**"Health check failed"**

- Check API logs: `docker logs chore-tracker-api`
- Verify environment file: `/opt/chore-tracker/env/prod.env`

**"Permission denied"**

- Verify IAM roles are correctly configured
- Check GitHub OIDC trust relationship

## Next Steps

1. ✅ **Test CI**: Create a PR and verify checks pass
2. ✅ **Test CD**: Push to `main` and watch deployment
3. 📝 **Configure monitoring**: Set up CloudWatch alarms
4. 📝 **Add notifications**: Slack/email for deployment status
5. 📝 **Create staging environment**: Separate workflow for testing

## Documentation

- **Detailed Setup**: [.github/workflows/README.md](./.github/workflows/README.md)
- **Manual Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Quick Reference**: [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)
- **Architecture**: [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

---

**Template Source**: Based on Network app CI/CD setup
**Created**: 2026-02-15
**Status**: ✅ Ready to use
