#!/usr/bin/env bash
set -euo pipefail

log() { echo "$@" >&2; }  # stderr logger

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEFAULTS="${INFRA_ROOT}/config/infra.app.config.defaults.json"
CONSUMER="${1:-infra.app.config.json}"

if [[ ! -f "$DEFAULTS" ]]; then
  echo "Defaults not found: $DEFAULTS" >&2
  exit 1
fi

log "defaults type: $(jq -r type "$DEFAULTS")"
[[ -f "$CONSUMER" ]] && log "consumer type: $(jq -r type "$CONSUMER")"

# Merge defaults first, then consumer overrides (recursive object merge; arrays replaced)
if [[ -f "$CONSUMER" ]]; then
  MERGED=$(jq -s '.[0] * .[1]' "$DEFAULTS" "$CONSUMER")
else
  MERGED=$(jq . "$DEFAULTS")
fi

# Validate required keys exist after merge (fail fast; no silent fallbacks)
echo "$MERGED" | jq -e '
  .appName and .env and .awsRegion and
  .ssm.tagHost and .ssm.tagEnv and
  .ssmPoll.delaySeconds and .ssmPoll.maxAttempts and
  .docker.nodeVersion and .docker.apiWorkspacePath and
  .docker.nxProject and .docker.devWorkspaceName and .docker.nodeEntrypoint
' >/dev/null

# Emit env vars (no defaults here; defaults live only in defaults.json)
echo "$MERGED" | jq -r '
  "APP_NAME=\(.appName)",
  "ENV_NAME=\(.env)",
  "AWS_REGION=\(.awsRegion)",
  "S3_BUCKET=\(.s3Bucket)",
  "SSM_TAG_HOST=\(.ssm.tagHost)",
  "SSM_TAG_ENV=\(.ssm.tagEnv)",
  "SSM_POLL_DELAY_SECONDS=\(.ssmPoll.delaySeconds)",
  "SSM_POLL_MAX_ATTEMPTS=\(.ssmPoll.maxAttempts)",
  "DOCKER_NODE_VERSION=\(.docker.nodeVersion)",
  "DOCKER_API_WORKSPACE_PATH=\(.docker.apiWorkspacePath)",
  "DOCKER_NX_PROJECT=\(.docker.nxProject)",
  "DOCKER_DEV_WORKSPACE=\(.docker.devWorkspaceName)",
  "DOCKER_NODE_ENTRYPOINT=\(.docker.nodeEntrypoint)"
'