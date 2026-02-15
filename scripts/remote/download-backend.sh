#!/usr/bin/env bash
set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET env var is required}"

mkdir -p /opt/chore-tracker/deploy /opt/chore-tracker/scripts

aws s3 cp "s3://${S3_BUCKET}/deployments/chore-tracker-api-latest.tar.gz" \
  /opt/chore-tracker/deploy/chore-tracker-api.tar.gz

aws s3 cp "s3://${S3_BUCKET}/deployments/docker-compose.prod.yml" \
  /opt/chore-tracker/docker-compose.prod.yml

aws s3 cp "s3://${S3_BUCKET}/deployments/deploy-ec2.sh" \
  /opt/chore-tracker/scripts/deploy-ec2.sh

chmod +x /opt/chore-tracker/scripts/deploy-ec2.sh
echo "Backend artifacts downloaded."
