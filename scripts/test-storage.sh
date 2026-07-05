#!/usr/bin/env bash
# Vérification rapide MinIO / stockage GeneaIA
set -euo pipefail

API="${API_URL:-http://localhost:3002/api}"
PHONE="${TEST_PHONE:-0700000001}"
PASSWORD="${TEST_PASSWORD:-password123}"

echo "=== GeneaIA — Test stockage MinIO ==="
echo "API: $API"
echo

status_json=$(curl -sf "$API/uploads/status")
ready=$(echo "$status_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ready', False))")
enabled=$(echo "$status_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('enabled', False))")

if [ "$enabled" != "True" ]; then
  echo "✗ Stockage désactivé — vérifiez S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY"
  exit 1
fi
if [ "$ready" != "True" ]; then
  echo "✗ MinIO non prêt — vérifiez que le conteneur minio est healthy"
  exit 1
fi
echo "✓ /uploads/status — enabled=true, ready=true"

login_json=$(curl -sf -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$login_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
if [ -z "$TOKEN" ]; then
  echo "✗ Connexion échouée — vérifiez TEST_PHONE / TEST_PASSWORD ou lancez le seed"
  exit 1
fi
echo "✓ Connexion OK"

trees_json=$(curl -sf -H "Authorization: Bearer $TOKEN" "$API/family-trees")
TREE_ID=$(echo "$trees_json" | python3 -c "
import sys,json
data=json.load(sys.stdin)
trees=data.get('trees', data if isinstance(data, list) else [])
print(trees[0]['id'] if trees else '')
")
if [ -z "$TREE_ID" ]; then
  echo "✗ Aucun arbre trouvé pour l'utilisateur de test"
  exit 1
fi

printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82' > /tmp/genea-storage-test.png

upload_json=$(curl -sf -X POST -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/tmp/genea-storage-test.png;type=image/png" \
  -F "treeId=$TREE_ID" \
  "$API/uploads/photo")
PHOTO_URL=$(echo "$upload_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('url',''))")
if [ -z "$PHOTO_URL" ]; then
  echo "✗ Upload photo échoué"
  echo "$upload_json"
  exit 1
fi
echo "✓ Upload photo — $PHOTO_URL"

http_code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$PHOTO_URL")
if [ "$http_code" != "200" ]; then
  echo "✗ Lecture fichier via proxy — HTTP $http_code"
  exit 1
fi
echo "✓ Lecture fichier via proxy — HTTP 200"
echo
echo "Stockage MinIO opérationnel."
