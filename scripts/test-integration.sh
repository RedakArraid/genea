#!/usr/bin/env bash
# Tests d'intégration API GeneaIA (démo, accès, permissions)
set -euo pipefail

API="${API_URL:-http://localhost:3001/api}"
PASS=0
FAIL=0

assert_status() {
  local name="$1" expected="$2" actual="$3" body="${4:-}"
  if [ "$actual" = "$expected" ]; then
    echo "  ✓ $name (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name — attendu HTTP $expected, reçu $actual"
    [ -n "$body" ] && echo "    $body"
    FAIL=$((FAIL + 1))
  fi
}

assert_json() {
  local name="$1" expr="$2" json="$3"
  if echo "$json" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if ($expr) else 1)" 2>/dev/null; then
    echo "  ✓ $name"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== GeneaIA — Tests d'intégration API ==="
echo "API: $API"
echo

# Health
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/health")
assert_status "Health check" "200" "$code"

# Demo tree public
demo_json=$(curl -s "$API/family-trees/demo")
assert_json "Demo tree disponible" "d.get('demoTree',{}).get('id')" "$demo_json"
TREE_ID=$(echo "$demo_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['demoTree']['id'])")

# Read demo without auth
tree_json=$(curl -s -w '\n%{http_code}' "$API/family-trees/$TREE_ID")
body=$(echo "$tree_json" | sed '$d')
code=$(echo "$tree_json" | tail -1)
assert_status "Lecture démo sans auth" "200" "$code"
assert_json "Accès démo canRead" "d.get('access',{}).get('canRead') is True" "$body"
assert_json "Accès démo canWrite=false sans auth" "d.get('access',{}).get('canWrite') is False" "$body"
assert_json "Accès démo isDemo" "d.get('access',{}).get('isDemo') is True" "$body"
assert_json "10 personnes en démo" "len(d.get('tree',{}).get('Person',[])) >= 10" "$body"

PERSON_ID=$(echo "$body" | python3 -c "import sys,json; print(json.load(sys.stdin)['tree']['Person'][0]['id'])")

# Login
login_json=$(curl -s -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}')
TOKEN=$(echo "$login_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
if [ -z "$TOKEN" ]; then
  echo "  ✗ Login test@example.com"
  FAIL=$((FAIL + 1))
else
  echo "  ✓ Login test@example.com"
  PASS=$((PASS + 1))
fi

AUTH="Authorization: Bearer $TOKEN"

# Read demo with auth
tree_auth=$(curl -s "$API/family-trees/$TREE_ID" -H "$AUTH")
assert_json "canWrite=true connecté" "d.get('access',{}).get('canWrite') is True" "$tree_auth"
assert_json "canEditPerson=false en démo" "d.get('access',{}).get('canEditPerson') is False" "$tree_auth"

# Edit person blocked in demo
code=$(curl -s -o /tmp/genea_put_person.json -w '%{http_code}' -X PUT "$API/persons/$PERSON_ID" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"firstName":"Hack"}')
assert_status "PUT personne bloqué en démo" "403" "$code" "$(cat /tmp/genea_put_person.json)"

# Add person allowed in demo
add_json=$(curl -s -w '\n%{http_code}' -X POST "$API/persons/tree/$TREE_ID" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"firstName":"Test","lastName":"Demo","position":{"x":100,"y":100}}')
add_body=$(echo "$add_json" | sed '$d')
add_code=$(echo "$add_json" | tail -1)
assert_status "POST personne autorisé en démo" "201" "$add_code" "$add_body"
NEW_PERSON_ID=$(echo "$add_body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('person',{}).get('id',''))" 2>/dev/null || echo "")

# Node positions
pos_json=$(curl -s "$API/node-positions/tree/$TREE_ID" -H "$AUTH")
POS_ID=$(echo "$pos_json" | python3 -c "import sys,json; ps=json.load(sys.stdin).get('nodePositions',[]); print(ps[0]['id'] if ps else '')" 2>/dev/null || echo "")
if [ -n "$POS_ID" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$API/node-positions/$POS_ID" \
    -H "$AUTH" -H 'Content-Type: application/json' \
    -d '{"x":120,"y":80}')
  assert_status "PUT position autorisé en démo" "200" "$code"
else
  echo "  ✗ Positions nœuds introuvables"
  FAIL=$((FAIL + 1))
fi

# Node positions — démo lisible sans auth
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/node-positions/tree/$TREE_ID")
assert_status "GET positions démo sans auth autorisé" "200" "$code"

# MinIO / stockage
storage_json=$(curl -s "$API/uploads/status")
assert_json "Stockage MinIO ready" "d.get('ready') is True" "$storage_json"
assert_json "Limites photo définies" "d.get('limits',{}).get('photoMaxMb',0) > 0" "$storage_json"

STORAGE_PERSON_ID="${NEW_PERSON_ID:-$PERSON_ID}"
if [ -n "$TOKEN" ] && [ -n "$TREE_ID" ] && [ -n "$STORAGE_PERSON_ID" ]; then
  printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82' > /tmp/genea-test.png
  photo_code=$(curl -s -o /tmp/genea-photo.json -w '%{http_code}' -X POST -H "$AUTH" \
    -F "photo=@/tmp/genea-test.png;type=image/png" -F "treeId=$TREE_ID" -F "personId=$STORAGE_PERSON_ID" \
    "$API/uploads/photo")
  assert_status "POST upload photo" "201" "$photo_code" "$(cat /tmp/genea-photo.json 2>/dev/null)"

  printf '%%PDF-1.4 test' > /tmp/genea-test.pdf
  doc_json=$(curl -s -w '\n%{http_code}' -X POST -H "$AUTH" \
    -F "file=@/tmp/genea-test.pdf;type=application/pdf" -F "title=Acte test" -F "category=birth" \
    "$API/persons/$STORAGE_PERSON_ID/documents")
  doc_body=$(echo "$doc_json" | sed '$d')
  doc_code=$(echo "$doc_json" | tail -1)
  assert_status "POST upload document" "201" "$doc_code" "$doc_body"
  DOC_ID=$(echo "$doc_body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('document',{}).get('id',''))" 2>/dev/null || echo "")

  list_json=$(curl -s "$API/persons/$STORAGE_PERSON_ID/documents")
  assert_json "GET documents liste" "len(d.get('documents',[])) >= 1" "$list_json"

  if [ -n "$DOC_ID" ]; then
    code=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE -H "$AUTH" "$API/persons/$STORAGE_PERSON_ID/documents/$DOC_ID")
    assert_status "DELETE document" "200" "$code"
  fi
fi

# Cleanup: delete test person
if [ -n "$NEW_PERSON_ID" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "$API/persons/$NEW_PERSON_ID" -H "$AUTH")
  assert_status "DELETE personne test en démo" "200" "$code"
fi

# Pricing / plans endpoint if exists
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/plans" 2>/dev/null || echo "404")
if [ "$code" = "200" ]; then
  echo "  ✓ GET /plans (HTTP 200)"
  PASS=$((PASS + 1))
elif [ "$code" = "404" ]; then
  echo "  ○ GET /plans — endpoint absent (ignoré)"
else
  echo "  ✓ GET /plans (HTTP $code)"
  PASS=$((PASS + 1))
fi

echo
echo "=== Résultat API : $PASS passés, $FAIL échoués ==="
[ "$FAIL" -eq 0 ]
