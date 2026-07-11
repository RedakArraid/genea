#!/usr/bin/env bash
# Smoke test OpenWA (health + config admin si API up)
set -euo pipefail

BASE="${OPENWA_BASE_URL:-http://localhost:2785/api}"
echo "OpenWA base: $BASE"

if curl -sf "${BASE%/api}/health" >/dev/null 2>&1 || curl -sf "$BASE/health" >/dev/null 2>&1; then
  echo "✓ OpenWA health OK"
else
  echo "✗ OpenWA indisponible — lancez docker compose -f docker-compose.openwa.yml up -d"
  exit 1
fi

echo "Configurez la session via l'admin /admin/openwa ou les logs du conteneur."
