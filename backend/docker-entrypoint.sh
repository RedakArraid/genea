#!/bin/sh
set -e
cd /app
echo "→ Prisma generate…"
npx prisma generate
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "→ Prisma migrate deploy…"
  npx prisma migrate deploy
fi
echo "→ Démarrage API…"
exec node src/index.js
