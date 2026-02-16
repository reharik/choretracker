# Deployment Scripts

This directory contains scripts for deploying ChoreTracker to EC2.

## Scripts

### `deploy-ec2.sh`

Main deployment script that runs on the EC2 instance.

**Purpose**: Loads Docker image, starts services, runs migrations

**Usage**:

```bash
# On EC2 instance
cd /opt/chore-tracker
./deploy-ec2.sh
```

**What it does**:

1. Validates required files exist
2. Loads Docker image from tar.gz
3. Starts services via docker-compose
4. Runs database migrations
5. Shows running containers

### `backup-db.sh`

Database backup script with optional S3 upload.

**Purpose**: Creates compressed PostgreSQL backups

**Usage**:

```bash
# Manual backup
cd /opt/chore-tracker
./backup-db.sh

# Automated (via cron)
0 2 * * * /opt/chore-tracker/backup-db.sh >> /opt/chore-tracker/backups/backup.log 2>&1
```

**What it does**:

1. Creates compressed SQL dump
2. Optionally uploads to S3 (if `S3_BACKUP_BUCKET` is set)
3. Cleans up old local backups (7 days)
4. Cleans up old S3 backups (30 days)

**Environment Variables**:

- `S3_BACKUP_BUCKET` (optional): S3 bucket for remote backups

## Remote Scripts (for SSM-based deployment)

The `remote/` directory would contain scripts executed via AWS Systems Manager:

- `download-backend.sh`: Downloads deployment artifacts from S3
- `deploy-backend.sh`: Executes backend deployment
- `deploy-frontend.sh`: Deploys frontend files
- `verify-backend.sh`: Verifies deployment health

**Note**: These are used with GitHub Actions and SSM. For manual deployment, use the main scripts above.

## Adding New Scripts

When creating new scripts:

1. Add shebang: `#!/usr/bin/env bash`
2. Enable strict mode: `set -euo pipefail`
3. Add documentation header
4. Make executable: `chmod +x script.sh`
5. Update this README

## Reference

For detailed deployment instructions, see:

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Comprehensive guide
- [DEPLOYMENT_QUICKSTART.md](../DEPLOYMENT_QUICKSTART.md) - Quick reference
