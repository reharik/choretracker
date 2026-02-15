#!/usr/bin/env bash
set -euo pipefail

cd /opt/chore-tracker
sudo /opt/chore-tracker/scripts/deploy-ec2.sh

rm -f /opt/chore-tracker/deploy/chore-tracker-api.tar.gz || true
echo "Backend deployed."
