#!/usr/bin/env bash
set -euo pipefail
exec python3 "$(dirname "$0")/render.py" "${1:?Usage: deploy/render.sh uat|prod}"
