# GitHub Actions Workflows

This directory contains CI/CD workflows for ChoreTracker.

## Workflows

### `ci.yml` - Continuous Integration

**Triggers**: All pushes and pull requests

**Jobs**:
1. **Lint** - Runs ESLint and Prettier checks
2. **Test** - Runs test suite with coverage
3. **Build** - Builds all projects (API, web, contracts)

**Purpose**: Validates code quality before merging

### `deploy-ec2.yml` - Continuous Deployment

**Triggers**: 
- Push to `main` branch (automatic)
- Manual workflow dispatch (with options to deploy backend/frontend separately)

**Jobs**:
1. **Deploy Backend**
   - Builds ARM64 Docker image
   - Uploads to S3
   - Deploys to EC2 via SSM
   - Runs database migrations
   - Verifies health

2. **Deploy Frontend**
   - Builds production frontend
   - Uploads to S3
   - Deploys to EC2 via SSM
   - Restarts Caddy proxy

**Requirements**: See setup section below

## Setup

### 1. AWS Infrastructure

#### S3 Bucket
Create an S3 bucket for deployment artifacts:

```bash
aws s3 mb s3://chore-tracker-deploy-ACCOUNT_ID-us-east-1
```

Update the bucket name in `.github/workflows/deploy-ec2.yml`:
```yaml
env:
  S3_BUCKET: chore-tracker-deploy-ACCOUNT_ID-us-east-1
```

#### IAM Role for OIDC

Create an IAM role for GitHub Actions with OIDC authentication:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/ChoreTracker:*"
        }
      }
    }
  ]
}
```

Attach policies:
- `AmazonS3FullAccess` (or scoped to your bucket)
- `AmazonSSMFullAccess` (or scoped to your instances)

#### EC2 Instance Setup

1. **Install SSM Agent** (usually pre-installed on Amazon Linux 2)

2. **Tag your instance**:
   ```
   App: chore-tracker
   Env: prod
   ```

3. **Create IAM instance role** with policies:
   - `AmazonSSMManagedInstanceCore`
   - S3 read access to deployment bucket

4. **Attach role to EC2 instance**

### 2. GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Required Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC | `arn:aws:iam::123456789:role/GitHubActionsRole` |

#### Optional Secrets

| Secret | Description | Default |
|--------|-------------|---------|
| `AWS_REGION` | AWS region | `us-east-1` |
| `S3_BUCKET` | Deployment bucket | Set in workflow file |

### 3. EC2 Preparation

On your EC2 instance, prepare the directory structure:

```bash
sudo mkdir -p /opt/chore-tracker/{env,deploy,backups,frontend,scripts}
sudo chown -R $USER:$USER /opt/chore-tracker
```

Create the production environment file:
```bash
# Copy from template
cp .env.production.sample /opt/chore-tracker/env/prod.env

# Edit with your values
nano /opt/chore-tracker/env/prod.env
```

## Usage

### Automatic Deployment

Push to `main` branch:
```bash
git push origin main
```

Both backend and frontend will deploy automatically.

### Manual Deployment

Go to Actions → Deploy to EC2 → Run workflow

Options:
- Deploy backend only
- Deploy frontend only
- Deploy both (default)

### Monitoring Deployments

1. **GitHub Actions UI**: Watch real-time logs
2. **AWS Systems Manager**: View SSM command execution
3. **EC2 Instance**: Check logs with `docker compose logs`

## Troubleshooting

### Deployment Fails at "Download backend artifacts"

**Problem**: EC2 can't access S3

**Solution**:
- Check EC2 IAM role has S3 read permissions
- Verify S3 bucket name is correct
- Check SSM agent is running: `sudo systemctl status amazon-ssm-agent`

### Deployment Fails at "Deploy backend"

**Problem**: Docker or environment issues

**Solution**:
- SSH to EC2 and check: `docker compose -f /opt/chore-tracker/docker-compose.prod.yml logs`
- Verify `/opt/chore-tracker/env/prod.env` exists and is correct
- Check Docker is running: `sudo systemctl status docker`

### Health Check Fails

**Problem**: API not responding

**Solution**:
- Check API logs: `docker logs chore-tracker-api`
- Verify database is running: `docker ps | grep chore-tracker-db`
- Check environment variables in `/opt/chore-tracker/env/prod.env`

### SSM Command Times Out

**Problem**: SSM can't reach instance

**Solution**:
- Verify instance has correct tags (`App=chore-tracker`, `Env=prod`)
- Check SSM agent is running on EC2
- Verify IAM instance role has `AmazonSSMManagedInstanceCore`
- Check instance appears in Systems Manager → Fleet Manager

## Cost Optimization

- **Build cache**: GitHub Actions caches Docker layers (free)
- **S3 storage**: ~$0.023/GB/month for artifacts
- **SSM commands**: Free (no data transfer charges)
- **Total CI/CD cost**: ~$0-2/month

## Security Best Practices

✅ **OIDC Authentication**: No long-lived AWS credentials in GitHub
✅ **Scoped IAM Roles**: Least privilege access
✅ **Secrets Management**: Sensitive values in GitHub Secrets
✅ **Private S3 Bucket**: Deployment artifacts not public
✅ **SSM over SSH**: No SSH keys to manage

## Advanced Configuration

### Deploy to Multiple Environments

Create separate workflows for staging/production:

```yaml
# .github/workflows/deploy-staging.yml
env:
  SSM_TAG_ENV: staging
  S3_BUCKET: chore-tracker-deploy-staging-ACCOUNT_ID-us-east-1
```

### Custom Build Arguments

Add build args to Docker build step:

```yaml
- name: Build Docker image
  uses: docker/build-push-action@v6
  with:
    build-args: |
      NODE_ENV=production
      BUILD_VERSION=${{ github.sha }}
```

### Slack Notifications

Add notification step:

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
```

## Reference

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS Systems Manager](https://docs.aws.amazon.com/systems-manager/)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Network App Workflows](../../network/.github/workflows/) - Reference implementation

---

For deployment without GitHub Actions, see [DEPLOYMENT.md](../../DEPLOYMENT.md)
