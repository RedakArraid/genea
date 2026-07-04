#!/usr/bin/env bash
# Tests E2E navigateur — back-office admin (Playwright)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
API_URL="${API_URL:-http://localhost:3001/api}"

cd "$ROOT"

if ! curl -sf "${API_URL}/health" >/dev/null; then
  echo "✗ API indisponible ($API_URL) — démarrez docker compose"
  exit 1
fi

if ! curl -sf "$FRONTEND_URL" >/dev/null; then
  echo "✗ Frontend indisponible ($FRONTEND_URL) — démarrez le frontend"
  exit 1
fi

export FRONTEND_URL

if [ ! -d node_modules/@playwright/test ]; then
  echo "→ Installation @playwright/test…"
  npm install --no-save @playwright/test@1.49.1
fi

if [ ! -d "$HOME/.cache/ms-playwright/chromium-"* ] 2>/dev/null && [ ! -d "$ROOT/node_modules/playwright-core/.local-browsers" ]; then
  echo "→ Installation navigateur Chromium…"
  npx playwright install chromium
fi

echo "=== GeneaIA — Tests E2E admin ==="
echo "Frontend: $FRONTEND_URL"
echo

npx playwright test e2e/admin.spec.ts
