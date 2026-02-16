# Deployment Optimization

## Skip Unchanged Backend Deployments

The CI/CD pipeline now **checks if the backend has changed** before deploying. This saves:

- ⏱️ Time: ~2-5 minutes per deployment
- 💰 Cost: S3 storage and transfer costs
- 🔄 EC2 load: Unnecessary container restarts

## How It Works

### Before Each Backend Deployment

1. **Check S3** for image with current git SHA:

   ```bash
   aws s3 ls "s3://${S3_BUCKET}/deployments/${APP_NAME}/*-api-${SHA}.tar.gz"
   ```

2. **If found**: Skip build, upload, download, and deployment
3. **If not found**: Proceed with full deployment

### What Gets Skipped

When backend hasn't changed:

- ❌ Docker image save/compress
- ❌ S3 upload (~200-300MB)
- ❌ S3 download on EC2
- ❌ Docker load
- ❌ Container restart
- ❌ Database migrations (already run)
- ❌ Health check verification

### What Still Runs

Even when backend is skipped:

- ✅ Frontend build and deployment
- ✅ Shared proxy setup/reload
- ✅ All CI checks (lint, test, build)

## When Backend Deploys

Backend **will** deploy when:

- API code changes (`api/src/**`)
- Dependencies change (`api/package.json`, root `package-lock.json`)
- Dockerfile changes (`api/Dockerfile`)
- Database migrations added/modified (`api/db/migrations/**`)
- Configuration changes (`api/vite.config.mjs`, `api/tsconfig.json`)

Backend **won't** deploy when:

- Only frontend code changes (`web/src/**`)
- Only documentation changes (`*.md`)
- Only CI/CD config changes (`.github/workflows/**`)
- Only deployment scripts change (`scripts/**`)

## Example Scenarios

### Scenario 1: Frontend-Only Change

```
Change: Update web/src/pages/Home.tsx
Result:
  ✅ Frontend builds and deploys
  ⏭️  Backend deployment skipped
  ⏱️  Saves ~3 minutes
```

### Scenario 2: Backend Change

```
Change: Update api/src/controllers/userController.ts
Result:
  ✅ Backend builds and deploys
  ✅ Frontend builds and deploys
  ⏱️  Full deployment
```

### Scenario 3: Documentation Only

```
Change: Update README.md
Result:
  ⏭️  Backend deployment skipped
  ⏭️  Frontend deployment skipped (if no frontend changes)
  ⏱️  CI runs tests only
```

## Manual Override

To force a backend deployment even if unchanged:

### Option 1: Manual Workflow Dispatch

In GitHub Actions UI:

1. Go to Actions → Deploy to EC2
2. Click "Run workflow"
3. Check "Deploy backend"

### Option 2: Empty Commit

```bash
git commit --allow-empty -m "Force backend redeploy"
git push
```

### Option 3: Delete S3 Artifact

```bash
# This will force next deployment to rebuild
aws s3 rm "s3://${S3_BUCKET}/deployments/${APP_NAME}/*-api-${SHA}.tar.gz"
```

## Monitoring

Check if backend was skipped in GitHub Actions logs:

```
✓ Check if backend already deployed
  Backend image for SHA abc123 already exists in S3

⏭️ Upload backend artifacts to S3 (skipped)
⏭️ Download backend artifacts on EC2 (skipped)
⏭️ Deploy backend on EC2 (skipped)
```

## Cost Savings

Assuming:

- 10 deployments per week
- 50% are frontend-only changes
- Each backend deployment: ~300MB S3 transfer

**Monthly savings:**

- S3 transfer: ~6GB saved
- EC2 CPU: ~15 minutes saved
- Developer time: ~15 minutes saved

## Caveats

- **First deployment** of each commit always runs (no SHA in S3 yet)
- **Parallel deployments** of same commit might both build (rare race condition)
- **S3 cleanup** needed periodically to remove old SHAs (see DOCKER_CLEANUP.md)

## Related

- See `DOCKER_CLEANUP.md` for cleaning up old images
- See `DEPLOYMENT.md` for full deployment documentation
