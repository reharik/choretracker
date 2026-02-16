#!/usr/bin/env bash
set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET env var is required}"
: "${APP_NAME:?APP_NAME env var is required}"

aws s3 cp "s3://${S3_BUCKET}/deployments/${APP_NAME}/frontend-latest.tar.gz" /tmp/frontend.tar.gz
aws s3 cp "s3://${S3_BUCKET}/deployments/${APP_NAME}/Caddyfile" /tmp/Caddyfile

rm -f /opt/chore-tracker/Caddyfile
mv /tmp/Caddyfile /opt/chore-tracker/Caddyfile

rm -rf /opt/chore-tracker/frontend
mkdir -p /opt/chore-tracker/frontend
tar -xzf /tmp/frontend.tar.gz -C /opt/chore-tracker/frontend
rm -f /tmp/frontend.tar.gz

: "${APP_NAME:=chore-tracker}"

cd /opt/chore-tracker
docker compose -p "${APP_NAME}" -f docker-compose.prod.yml restart proxy
echo "Frontend deployed."
