#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_SCRIPT="$ROOT_DIR/frontend.sh"

usage() {
  cat <<'EOF'
Usage:
  ./frontend_build.sh
  ./frontend_build.sh --help

準備 Podman/npm 編譯環境，並以 Vite production mode 建置
scan 與 print。Vite 會產生壓縮後的正式靜態資源。
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
    echo "ERROR: frontend_build.sh 不接受參數 '$1'" >&2
    usage >&2
    exit 1
    ;;
esac

export MIS_FRONTEND_NON_INTERACTIVE=1

"$FRONTEND_SCRIPT" image
"$FRONTEND_SCRIPT" ci scan
"$FRONTEND_SCRIPT" ci print
"$FRONTEND_SCRIPT" build scan
"$FRONTEND_SCRIPT" build print
