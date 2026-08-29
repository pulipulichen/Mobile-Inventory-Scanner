#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_SCRIPT="$ROOT_DIR/frontend.sh"
IMAGE_NAME="${MIS_FRONTEND_IMAGE:-localhost/mobile-inventory-scanner-frontend:node24}"

usage() {
  cat <<'EOF'
Usage:
  ./frontend_dev.sh
  ./frontend_dev.sh --help

啟動 scan 與 print 的 Vite 開發伺服器，並持續 watch 程式碼變更。

開發網址：
  scan   http://localhost:5173
  print  http://localhost:5174
EOF
}

case "${1:-}" in
  "")
    ;;
  -h|--help|help)
    usage
    exit 0
    ;;
  *)
    echo "ERROR: frontend_dev.sh 不接受參數 '$1'" >&2
    usage >&2
    exit 1
    ;;
esac

export MIS_FRONTEND_NON_INTERACTIVE=1

if ! command -v podman >/dev/null 2>&1; then
  echo "ERROR: podman not found" >&2
  exit 1
fi

if ! command -v ss >/dev/null 2>&1; then
  echo "ERROR: ss not found; cannot check whether frontend ports are occupied" >&2
  exit 1
fi

check_existing_dev_servers() {
  local running_containers
  local app port
  local project_container_info container_info listener_info
  local running_found=0 conflict_found=0
  local container_id container_name container_image container_ports

  running_containers="$(podman ps --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Ports}}')"

  for app in scan print; do
    case "$app" in
      scan) port=5173 ;;
      print) port=5174 ;;
    esac

    project_container_info="$(
      while IFS=$'\t' read -r container_id container_name container_image container_ports; do
        if [[ "$container_image" == "$IMAGE_NAME" &&
          "$container_ports" == *":${port}->"* ]]; then
          printf '%s\t%s\n' "$container_id" "$container_name"
        fi
      done <<< "$running_containers"
    )"

    if [[ -n "$project_container_info" ]]; then
      running_found=1
      while IFS=$'\t' read -r container_id container_name; do
        echo "INFO: $app 開發伺服器已在執行（容器 $container_name/$container_id，port $port）。"
        echo "      開啟網址：http://localhost:$port/"
      done <<< "$project_container_info"
      continue
    fi

    container_info="$(
      while IFS=$'\t' read -r container_id container_name container_image container_ports; do
        if [[ "$container_ports" == *":${port}->"* ]]; then
          printf '%s\t%s\t%s\n' "$container_id" "$container_name" "$container_image"
        fi
      done <<< "$running_containers"
    )"

    listener_info="$(ss -H -ltnp "sport = :$port" 2>/dev/null || true)"
    if [[ -n "$container_info" || -n "$listener_info" ]]; then
      conflict_found=1
      echo "ERROR: $app 開發伺服器未在執行，但 port $port 已被占用。" >&2
      if [[ -n "$container_info" ]]; then
        while IFS=$'\t' read -r container_id container_name container_image; do
          echo "  占用容器：$container_name/$container_id（$container_image）" >&2
        done <<< "$container_info"
      else
        echo "  占用程序：$listener_info" >&2
      fi
    fi
  done

  if (( conflict_found )); then
    return 1
  fi

  if (( running_found )); then
    echo "INFO: 已有 Mobile Inventory Scanner 開發伺服器執行，不會重複啟動。"
    exit 0
  fi
}

if ! check_existing_dev_servers; then
  exit 1
fi

"$FRONTEND_SCRIPT" image
"$FRONTEND_SCRIPT" ci scan
"$FRONTEND_SCRIPT" ci print

pids=()

cleanup() {
  local pid

  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done

  for pid in "${pids[@]}"; do
    wait "$pid" 2>/dev/null || true
  done
}

trap cleanup EXIT
trap 'exit 130' INT TERM

"$FRONTEND_SCRIPT" dev scan &
pids+=("$!")

"$FRONTEND_SCRIPT" dev print &
pids+=("$!")

set +e
wait -n "${pids[@]}"
status=$?
set -e

exit "$status"
