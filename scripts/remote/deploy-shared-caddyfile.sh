#!/usr/bin/env bash
set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET env var is required}"

echo "Deploying shared Caddyfile..."

# Create shared directory if it doesn't exist
mkdir -p /opt/shared

# Download shared Caddyfile from S3
aws s3 cp "s3://${S3_BUCKET}/deployments/shared/Caddyfile" /opt/shared/Caddyfile

echo "Shared Caddyfile deployed to /opt/shared/Caddyfile"
