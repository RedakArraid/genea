#!/bin/sh
set -e
cd /app
echo "→ Prisma generate…"
npx prisma generate
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "→ Prisma migrate deploy…"
  npx prisma migrate deploy
fi
if [ -n "${ADMIN_EMAIL:-}" ]; then
  echo "→ Compte admin (${ADMIN_EMAIL})…"
  node scripts/ensure-admin.js
fi
echo "→ Démarrage API…"
exec node src/index.js
