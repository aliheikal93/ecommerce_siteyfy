#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

printf '%s\n' '=== SITEYFY durable project memory ==='
cat PROJECT_MEMORY.md
printf '\n%s\n' '=== CodeGraph status ==='
codegraph status "$ROOT_DIR"

if (($#)); then
  printf '\n%s\n' '=== CodeGraph exploration ==='
  codegraph explore "$*" --path "$ROOT_DIR"
else
  printf '\n%s\n' 'Pass a question to trace a feature, for example:'
  printf '%s\n' './scripts/codex-context.sh "Trace order checkout through payment and shipment creation"'
fi
