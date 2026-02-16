# Docker Cleanup Guide

## Automatic Cleanup

The deployment scripts now automatically remove dangling images after each deployment.

## Manual Cleanup

### Quick Cleanup (Safe)

Run the cleanup script on EC2:

```bash
# Via SSM
./scripts/ssm-run.sh "ChoreTracker: Docker cleanup" scripts/remote/cleanup-docker.sh

# Or directly on EC2
bash /opt/chore-tracker/scripts/cleanup-docker.sh
```

### Manual Commands

**Remove dangling images** (untagged, safe):

```bash
docker image prune -f
```

**Remove unused images** (not used by any container):

```bash
docker image prune -a -f
```

**Remove specific old images**:

```bash
# List all images
docker images

# Remove specific image
docker rmi <image-id>

# Remove all chore-tracker images except latest
docker images | grep chore-tracker-api | grep -v latest | awk '{print $3}' | xargs docker rmi
```

**Check disk usage**:

```bash
docker system df
docker system df -v  # verbose
```

**Nuclear option** (removes everything not in use):

```bash
docker system prune -a -f --volumes
```

⚠️ **Warning**: This removes ALL unused images, containers, networks, and volumes!

## Scheduled Cleanup

To run cleanup weekly, add to crontab on EC2:

```bash
# Edit crontab
crontab -e

# Add this line (runs every Sunday at 2 AM)
0 2 * * 0 /opt/chore-tracker/scripts/cleanup-docker.sh >> /var/log/docker-cleanup.log 2>&1
```

## What Gets Cleaned

### Automatic (on each deploy)

- Dangling images (untagged images from previous builds)

### Manual cleanup script

- Dangling images
- Unused images older than 24 hours
- Stopped containers older than 24 hours
- Unused volumes
- Unused networks

### What's Kept

- Images tagged with `:latest`
- Images used by running containers
- Active volumes (database data)
- Active networks
