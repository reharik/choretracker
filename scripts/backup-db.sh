#!/usr/bin/env bash
set -euo pipefail

# Database Backup Script for ChoreTracker
# This script creates compressed PostgreSQL backups and optionally uploads to S3
# Designed to run via cron on the EC2 instance

BACKUP_DIR="/opt/chore-tracker/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="chore_tracker_db_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Optional: S3 bucket for remote backups
S3_BACKUP_BUCKET="${S3_BACKUP_BUCKET:-}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup at $(date)"

# Create backup using docker compose
cd /opt/chore-tracker
docker compose --env-file /opt/chore-tracker/env/prod.env -f docker-compose.prod.yml exec -T db \
  pg_dump -U postgres chore_tracker | gzip > "${BACKUP_PATH}"

echo "Backup created: ${BACKUP_PATH}"
echo "Backup size: $(du -h "${BACKUP_PATH}" | cut -f1)"

# Upload to S3 if configured
if [ -n "${S3_BACKUP_BUCKET}" ]; then
  echo "Uploading to S3: s3://${S3_BACKUP_BUCKET}/backups/${BACKUP_FILE}"
  aws s3 cp "${BACKUP_PATH}" "s3://${S3_BACKUP_BUCKET}/backups/${BACKUP_FILE}"
  echo "S3 upload complete"
fi

# Clean up old local backups (keep last 7 days)
echo "Cleaning up old backups (keeping last 7 days)"
find "${BACKUP_DIR}" -name "chore_tracker_db_*.sql.gz" -type f -mtime +7 -delete

# Clean up old S3 backups (keep last 30 days) if S3 is configured
if [ -n "${S3_BACKUP_BUCKET}" ]; then
  echo "Cleaning up old S3 backups (keeping last 30 days)"
  CUTOFF_DATE=$(date -d '30 days ago' +%Y%m%d)
  aws s3 ls "s3://${S3_BACKUP_BUCKET}/backups/" | while read -r line; do
    BACKUP_DATE=$(echo "$line" | awk '{print $4}' | grep -oP 'chore_tracker_db_\K\d{8}' || true)
    if [ -n "${BACKUP_DATE}" ] && [ "${BACKUP_DATE}" -lt "${CUTOFF_DATE}" ]; then
      BACKUP_NAME=$(echo "$line" | awk '{print $4}')
      echo "Deleting old S3 backup: ${BACKUP_NAME}"
      aws s3 rm "s3://${S3_BACKUP_BUCKET}/backups/${BACKUP_NAME}"
    fi
  done
fi

echo "Backup complete at $(date)"
