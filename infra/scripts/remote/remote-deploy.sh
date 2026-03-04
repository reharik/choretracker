#!/usr/bin/env bash
set -euo pipefail

# S3-staged SSM runner:
# - Uploads the remote script to S3 (from the runner)
# - EC2 downloads it via aws s3 cp
# - Runs it with a small env file
#
# Required env:
#   AWS_REGION
#   S3_BUCKET
#
# Optional:
#   SSM_TAG_APP (default network)
#   SSM_TAG_ENV (default prod)
#   SSM_TARGETS_OVERRIDE (e.g. 'Key=InstanceIds,Values=i-0123abcd')
#   SSM_POLL_DELAY_SECONDS (default 2)
#   SSM_POLL_MAX_ATTEMPTS  (default 180)

_ssm_default_targets() {
  local host="${SSM_TAG_HOST:-prod-shared}"
  local env="${SSM_TAG_ENV:-prod}"
  echo "Key=tag:Host,Values=${host}" "Key=tag:Env,Values=${env}"
}

_ssm_poll_delay() { echo "${SSM_POLL_DELAY_SECONDS:-2}"; }
_ssm_poll_max()   { echo "${SSM_POLL_MAX_ATTEMPTS:-180}"; }

_ssm_upload_script_to_s3() {
  local local_path="$1"
  local key="$2"

  aws s3 cp "$local_path" "s3://${S3_BUCKET}/${key}" --region "${AWS_REGION}" >/dev/null
}

_ssm_send_command() {
  local comment="$1"
  local remote_script_path="$2"

  if [[ -z "${AWS_REGION:-}" ]]; then echo "AWS_REGION is required" >&2; return 2; fi
  if [[ -z "${S3_BUCKET:-}" ]]; then echo "S3_BUCKET is required" >&2; return 2; fi
  if [[ ! -f "$remote_script_path" ]]; then echo "Remote script not found: $remote_script_path" >&2; return 2; fi

  # Targets
  local -a targets=()
  if [[ -n "${SSM_TARGETS_OVERRIDE:-}" ]]; then
    # shellcheck disable=SC2206
    targets=(${SSM_TARGETS_OVERRIDE})
  else
    # shellcheck disable=SC2206
    targets=($(_ssm_default_targets))
  fi

  # Upload script to S3 under a unique key for this run
  local run_id="${GITHUB_RUN_ID:-manual}"
  local attempt="${GITHUB_RUN_ATTEMPT:-0}"
  local sha="${GITHUB_SHA:-nosha}"
  local base
  base="$(basename "$remote_script_path")"

  local script_key="deployments/ssm-scripts/${sha}/${run_id}-${attempt}/${base}"
  _ssm_upload_script_to_s3 "$remote_script_path" "$script_key"

  # Env file (small + safe)
  local env_text=""
  for v in AWS_REGION S3_BUCKET APP_NAME ENV SHA DEPLOY_BACKEND DEPLOY_FRONTEND; do

    if [[ -n "${!v:-}" ]]; then env_text+="${v}=${!v}"$'\n'; fi
  done

  local env_key="deployments/ssm-scripts/${sha}/${run_id}-${attempt}/remote.env"
  printf "%s" "$env_text" > /tmp/remote.env
  _ssm_upload_script_to_s3 /tmp/remote.env "$env_key"

  cat > /tmp/ssm-params.json <<JSON
{
  "commands": [
    "bash -c 'set -euo pipefail; \
aws s3 cp \"s3://${S3_BUCKET}/${env_key}\" /tmp/remote.env --region \"${AWS_REGION}\"; \
aws s3 cp \"s3://${S3_BUCKET}/${script_key}\" /tmp/remote.sh --region \"${AWS_REGION}\"; \
chmod +x /tmp/remote.sh; \
set -a; source /tmp/remote.env; set +a; \
/tmp/remote.sh'"
  ]
}
JSON

  aws ssm send-command \
    --region "${AWS_REGION}" \
    --document-name "AWS-RunShellScript" \
    --targets "${targets[@]}" \
    --comment "$comment" \
    --parameters file:///tmp/ssm-params.json \
    --query "Command.CommandId" \
    --output text
}

_ssm_get_instance_ids() {
  local command_id="$1"
  for _ in {1..30}; do
    local ids
    ids="$(
      aws ssm list-command-invocations \
        --region "${AWS_REGION}" \
        --command-id "$command_id" \
        --query "CommandInvocations[].InstanceId" \
        --output text 2>/dev/null || true
    )"
    if [[ -n "${ids// /}" ]]; then echo "$ids"; return 0; fi
    sleep 2
  done
  return 1
}

_ssm_dump_instance_output() {
  local command_id="$1"
  local instance_id="$2"

  aws ssm list-command-invocations \
    --region "${AWS_REGION}" \
    --command-id "$command_id" \
    --details \
    --query "CommandInvocations[?InstanceId=='$instance_id'].{
      InstanceId:InstanceId,
      Status:Status,
      ResponseCode:CommandPlugins[0].ResponseCode,
      Stdout:CommandPlugins[0].Output,
      Stderr:CommandPlugins[0].StandardErrorContent
    }" \
    --output table || true
}

ssm_run() {
  local comment="$1"
  local remote_script_path="$2"

  local command_id
  command_id="$(_ssm_send_command "$comment" "$remote_script_path")"
  echo "SSM CommandId: $command_id"

  local instance_ids
  if ! instance_ids="$(_ssm_get_instance_ids "$command_id")"; then
    echo "No instances returned for command-id=$command_id" >&2
    return 1
  fi

  local delay max_attempts
  delay="$(_ssm_poll_delay)"
  max_attempts="$(_ssm_poll_max)"

  local attempt=0
  while true; do
    attempt=$((attempt + 1))
    local any_in_progress=0

    for iid in $instance_ids; do
      local status
      status="$(
        aws ssm list-command-invocations \
          --region "${AWS_REGION}" \
          --command-id "$command_id" \
          --details \
          --query "CommandInvocations[?InstanceId=='$iid'].Status | [0]" \
          --output text 2>/dev/null || echo ""
      )"
      case "$status" in
        Pending|InProgress|Delayed|"") any_in_progress=1 ;;
      esac
    done

    if [[ "$any_in_progress" -eq 0 ]]; then break; fi
    if [[ "$attempt" -ge "$max_attempts" ]]; then
      echo "SSM command did not finish within bounds." >&2
      break
    fi
    sleep "$delay"
  done

  local failed=0
  for iid in $instance_ids; do
    _ssm_dump_instance_output "$command_id" "$iid"
    local final_status
    final_status="$(
      aws ssm list-command-invocations \
        --region "${AWS_REGION}" \
        --command-id "$command_id" \
        --details \
        --query "CommandInvocations[?InstanceId=='$iid'].Status | [0]" \
        --output text 2>/dev/null || echo "Unknown"
    )"
    [[ "$final_status" == "Success" ]] || failed=1
  done

  [[ "$failed" -eq 0 ]]
}
export -f ssm_run
