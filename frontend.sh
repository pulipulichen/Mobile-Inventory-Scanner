#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="${MIS_FRONTEND_IMAGE:-localhost/mobile-inventory-scanner-frontend:node24}"

usage() {
  cat <<'EOF'
Usage:
  ./frontend.sh image
  ./frontend.sh install <scan|print>
  ./frontend.sh ci <scan|print>
  ./frontend.sh dev <scan|print>
  ./frontend.sh build <scan|print>
  ./frontend.sh test <scan|print>
  ./frontend.sh npm <scan|print> <npm arguments...>
  ./frontend.sh shell <scan|print>

Examples:
  ./frontend.sh image
  ./frontend.sh install scan
  ./frontend.sh dev scan
  ./frontend.sh build print
  ./frontend.sh npm scan install @undecaf/zbar-wasm
EOF
}

require_podman() {
  if ! command -v podman >/dev/null 2>&1; then
    echo "ERROR: podman not found" >&2
    exit 1
  fi
}

validate_app() {
  local app="${1:-}"
  case "$app" in
    scan|print) ;;
    *)
      echo "ERROR: app must be 'scan' or 'print'" >&2
      usage
      exit 1
      ;;
  esac
}

build_image() {
  podman build \
    --file "$ROOT_DIR/Containerfile.frontend" \
    --tag "$IMAGE_NAME" \
    "$ROOT_DIR"
}

ensure_image() {
  if ! podman image exists "$IMAGE_NAME"; then
    build_image
  fi
}

run_app() {
  local app="$1"
  shift

  ensure_image

  podman run --rm -it \
    --userns=keep-id \
    --volume "$ROOT_DIR:/workspace:Z" \
    --workdir "/workspace/$app" \
    "$IMAGE_NAME" \
    "$@"
}

run_dev() {
  local app="$1"
  local port

  case "$app" in
    scan) port=5173 ;;
    print) port=5174 ;;
  esac

  ensure_image

  podman run --rm -it \
    --userns=keep-id \
    --volume "$ROOT_DIR:/workspace:Z" \
    --workdir "/workspace/$app" \
    --publish "$port:$port" \
    "$IMAGE_NAME" \
    npm run dev -- --host 0.0.0.0 --port "$port"
}

main() {
  require_podman

  local command="${1:-}"

  case "$command" in
    image)
      build_image
      ;;
    install|ci|build|test|shell|npm|dev)
      local app="${2:-}"
      validate_app "$app"
      ;;
    -h|--help|help|"")
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown command '$command'" >&2
      usage
      exit 1
      ;;
  esac

  case "$command" in
    install)
      run_app "$app" npm install
      ;;
    ci)
      run_app "$app" npm ci
      ;;
    dev)
      run_dev "$app"
      ;;
    build)
      run_app "$app" npm run build
      ;;
    test)
      run_app "$app" npm test
      ;;
    npm)
      shift 2
      run_app "$app" npm "$@"
      ;;
    shell)
      run_app "$app" bash
      ;;
  esac
}

main "$@"
