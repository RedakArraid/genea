#!/usr/bin/env bash
# Vérification syntaxique des fichiers JS backend
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

count=0
while IFS= read -r -d '' file; do
  node --check "$file"
  count=$((count + 1))
done < <(find src prisma -name '*.js' -print0)

echo "✓ $count fichiers JS backend valides"
