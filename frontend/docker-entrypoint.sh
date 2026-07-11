#!/bin/sh
set -e
cd /app
if [ ! -d node_modules/react-i18next ] || [ ! -d node_modules/libphonenumber-js ]; then
  echo "→ npm install (dépendances manquantes)…"
  npm install
fi
exec npm run dev -- --host 0.0.0.0 --port 5173
