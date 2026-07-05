#!/usr/bin/env bash
# Tests E2E Playwright — GeneaIA (tous les specs)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5174}"
API_URL="${API_URL:-http://localhost:3002/api}"
SPECS="${*:-}"

cd "$ROOT"

if ! curl -sf "${API_URL}/health" >/dev/null; then
  echo "✗ API indisponible ($API_URL) — lancez : docker compose up -d"
  exit 1
fi

if ! curl -sf "$FRONTEND_URL" >/dev/null; then
  echo "✗ Frontend indisponible ($FRONTEND_URL) — lancez : docker compose up -d"
  exit 1
fi

export FRONTEND_URL

if [ ! -d node_modules/@playwright/test ]; then
  echo "→ Installation @playwright/test…"
  npm install
fi

echo "→ Installation navigateur Chromium (si nécessaire)…"
npx playwright install chromium

echo "=== GeneaIA — Tests E2E Playwright ==="
echo "Frontend: $FRONTEND_URL"
echo "API:      $API_URL"
echo

if [ -n "$SPECS" ]; then
  npx playwright test "$SPECS"
else
  npx playwright test
fi
