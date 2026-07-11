#!/usr/bin/env bash
# Lance les tests backend (Docker si disponible, sinon local avec Postgres)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINER="${GENEA_BACKEND_CONTAINER:-geneamap-backend-local-v2}"

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER"; then
  echo "→ Tests backend via Docker ($CONTAINER)"
  docker exec "$CONTAINER" npm test
  exit 0
fi

echo "→ Tests backend en local"
export NODE_ENV="${NODE_ENV:-test}"
export DATABASE_URL="${DATABASE_URL:-postgresql://geneamap_user:geneamap_password@localhost:5436/geneamap_local?schema=public}"
cd "$ROOT/backend"
npm test -- --forceExit
