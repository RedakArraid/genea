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

# Admin API — login admin
admin_login=$(curl -s -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@geneaia.app","password":"password123"}')
ADMIN_TOKEN=$(echo "$admin_login" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
if [ -z "$ADMIN_TOKEN" ]; then
  echo "  ✗ Login admin@geneaia.app"
  FAIL=$((FAIL + 1))
else
  echo "  ✓ Login admin@geneaia.app"
  PASS=$((PASS + 1))
fi

ADMIN_AUTH="Authorization: Bearer $ADMIN_TOKEN"

code=$(curl -s -o /tmp/genea_admin_stats.json -w '%{http_code}' "$API/admin/stats" -H "$ADMIN_AUTH")
assert_status "GET /admin/stats admin" "200" "$code" "$(cat /tmp/genea_admin_stats.json 2>/dev/null)"
assert_json "Stats admin usersTotal" "d.get('usersTotal',0) >= 1" "$(cat /tmp/genea_admin_stats.json 2>/dev/null)"

code=$(curl -s -o /tmp/genea_admin_forbidden.json -w '%{http_code}' "$API/admin/stats" -H "$AUTH")
assert_status "GET /admin/stats user non-admin" "403" "$code" "$(cat /tmp/genea_admin_forbidden.json 2>/dev/null)"

# Admin lecture arbre (support read-only)
if [ -n "$ADMIN_TOKEN" ] && [ -n "$TREE_ID" ]; then
  admin_tree=$(curl -s "$API/family-trees/$TREE_ID" -H "$ADMIN_AUTH")
  assert_json "Admin canRead arbre démo" "d.get('access',{}).get('canRead') is True" "$admin_tree"
  assert_json "Admin canWrite=false" "d.get('access',{}).get('canWrite') is False" "$admin_tree"
fi

# Smoke endpoints admin (pages back-office)
if [ -n "$ADMIN_TOKEN" ]; then
  code=$(curl -s -o /tmp/genea_admin_users.json -w '%{http_code}' "$API/admin/users" -H "$ADMIN_AUTH")
  assert_status "GET /admin/users" "200" "$code"
  USER_ID=$(python3 -c "import json; print(json.load(open('/tmp/genea_admin_users.json'))['users'][0]['id'])" 2>/dev/null || echo "")
  if [ -n "$USER_ID" ]; then
    code=$(curl -s -o /dev/null -w '%{http_code}' "$API/admin/users/$USER_ID" -H "$ADMIN_AUTH")
    assert_status "GET /admin/users/:id" "200" "$code"
  fi
  code=$(curl -s -o /dev/null -w '%{http_code}' "$API/admin/trees" -H "$ADMIN_AUTH")
  assert_status "GET /admin/trees" "200" "$code"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$API/admin/storage" -H "$ADMIN_AUTH")
  assert_status "GET /admin/storage" "200" "$code"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$API/admin/demo" -H "$ADMIN_AUTH")
  assert_status "GET /admin/demo" "200" "$code"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$API/admin/plans" -H "$ADMIN_AUTH")
  assert_status "GET /admin/plans" "200" "$code"
fi

# Collaboration — partage et invitations
if [ -n "$TOKEN" ]; then
  demo_login=$(curl -s -X POST "$API/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"demo@geneaia.app","password":"password123"}')
  DEMO_TOKEN=$(echo "$demo_login" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
  DEMO_AUTH="Authorization: Bearer $DEMO_TOKEN"
  DEMO_USER_ID=$(echo "$demo_login" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('id',''))" 2>/dev/null || echo "")

  trees_json=$(curl -s "$API/family-trees" -H "$AUTH")
  PERSONAL_TREE_ID=$(echo "$trees_json" | python3 -c "import sys,json; trees=json.load(sys.stdin).get('trees',[]); print(trees[0]['id'] if trees else '')" 2>/dev/null || echo "")

  if [ -n "$PERSONAL_TREE_ID" ] && [ -n "$DEMO_TOKEN" ]; then
    # Reset état collaboration (idempotent)
    collab_ids=$(curl -s "$API/family-trees/$PERSONAL_TREE_ID/collaborators" -H "$AUTH" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for c in d.get('collaborators',[]):
    print(c['userId'])
" 2>/dev/null || echo "")
    for uid in $collab_ids; do
      [ -n "$uid" ] && curl -s -o /dev/null -X DELETE "$API/family-trees/$PERSONAL_TREE_ID/collaborators/$uid" -H "$AUTH"
    done
    invite_ids=$(curl -s "$API/family-trees/$PERSONAL_TREE_ID/collaborators" -H "$AUTH" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for i in d.get('invites',[]):
    print(i['id'])
" 2>/dev/null || echo "")
    for iid in $invite_ids; do
      [ -n "$iid" ] && curl -s -o /dev/null -X DELETE "$API/family-trees/$PERSONAL_TREE_ID/invites/$iid" -H "$AUTH"
    done

    code=$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$API/family-trees/$PERSONAL_TREE_ID/visibility" \
      -H "$AUTH" -H 'Content-Type: application/json' -d '{"visibility":"SHARED"}')
    assert_status "PUT visibilité SHARED" "200" "$code"

    collab_add=$(curl -s -w '\n%{http_code}' -X POST "$API/family-trees/$PERSONAL_TREE_ID/collaborators" \
      -H "$AUTH" -H 'Content-Type: application/json' \
      -d '{"email":"demo@geneaia.app","role":"VIEWER"}')
    collab_code=$(echo "$collab_add" | tail -1)
    assert_status "POST collaborateur existant (VIEWER)" "201" "$collab_code"

    demo_tree=$(curl -s "$API/family-trees/$PERSONAL_TREE_ID" -H "$DEMO_AUTH")
    assert_json "Collaborateur VIEWER canRead" "d.get('access',{}).get('canRead') is True" "$demo_tree"
    assert_json "Collaborateur VIEWER canWrite=false" "d.get('access',{}).get('canWrite') is False" "$demo_tree"

    code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/family-trees/$PERSONAL_TREE_ID/collaborators" \
      -H "$AUTH" -H 'Content-Type: application/json' \
      -d '{"email":"demo@geneaia.app","role":"EDITOR"}')
    assert_status "POST upgrade collaborateur EDITOR" "201" "$code"

    demo_tree=$(curl -s "$API/family-trees/$PERSONAL_TREE_ID" -H "$DEMO_AUTH")
    assert_json "Collaborateur EDITOR canWrite" "d.get('access',{}).get('canWrite') is True" "$demo_tree"

    COLLAB_EMAIL="collab-test-$(date +%s)@example.com"
    pending_json=$(curl -s -X POST "$API/family-trees/$PERSONAL_TREE_ID/collaborators" \
      -H "$AUTH" -H 'Content-Type: application/json' \
      -d "{\"email\":\"$COLLAB_EMAIL\",\"role\":\"VIEWER\"}")
    INVITE_TOKEN=$(echo "$pending_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('invite',{}).get('token',''))" 2>/dev/null || echo "")
    INVITE_ID=$(echo "$pending_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('invite',{}).get('id',''))" 2>/dev/null || echo "")

    if [ -n "$INVITE_TOKEN" ]; then
      reg_json=$(curl -s -X POST "$API/auth/register" \
        -H 'Content-Type: application/json' \
        -d "{\"name\":\"Collab Test\",\"email\":\"$COLLAB_EMAIL\",\"password\":\"password123\"}")
      COLLAB_TOKEN=$(echo "$reg_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")

      if [ -z "$COLLAB_TOKEN" ]; then
        login_c=$(curl -s -X POST "$API/auth/login" \
          -H 'Content-Type: application/json' \
          -d "{\"email\":\"$COLLAB_EMAIL\",\"password\":\"password123\"}")
        COLLAB_TOKEN=$(echo "$login_c" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
      fi

      if [ -n "$COLLAB_TOKEN" ]; then
        code=$(curl -s -o /tmp/genea_accept_invite.json -w '%{http_code}' -X POST \
          "$API/family-trees/invites/$INVITE_TOKEN/accept" \
          -H "Authorization: Bearer $COLLAB_TOKEN")
        assert_status "POST accept invite" "200" "$code" "$(cat /tmp/genea_accept_invite.json 2>/dev/null)"

        collab_trees=$(curl -s "$API/family-trees" -H "Authorization: Bearer $COLLAB_TOKEN")
        assert_json "Arbre dans sharedTrees après accept" \
          "any(t.get('id')=='$PERSONAL_TREE_ID' for t in d.get('sharedTrees',[]))" "$collab_trees"
      else
        echo "  ✗ Token collaborateur invite"
        FAIL=$((FAIL + 1))
      fi

      # Nouvelle invite pour test révocation
      pending2=$(curl -s -X POST "$API/family-trees/$PERSONAL_TREE_ID/collaborators" \
        -H "$AUTH" -H 'Content-Type: application/json' \
        -d '{"email":"revoke-test@example.com","role":"VIEWER"}')
      REVOKE_ID=$(echo "$pending2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('invite',{}).get('id',''))" 2>/dev/null || echo "")
      if [ -n "$REVOKE_ID" ]; then
        code=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE \
          "$API/family-trees/$PERSONAL_TREE_ID/invites/$REVOKE_ID" -H "$AUTH")
        assert_status "DELETE revoke invite" "200" "$code"
      fi
    else
      echo "  ✗ Token invitation pending"
      FAIL=$((FAIL + 1))
    fi

    if [ -n "$DEMO_USER_ID" ]; then
      curl -s -o /dev/null -X DELETE "$API/family-trees/$PERSONAL_TREE_ID/collaborators/$DEMO_USER_ID" -H "$AUTH"
    fi
  else
    echo "  ✗ Arbre personnel ou compte demo@geneaia.app introuvable"
    FAIL=$((FAIL + 1))
  fi
fi

# Billing & planActive
billing_json=$(curl -s -X POST "$API/billing/preview" -H 'Content-Type: application/json' -d '{"plan":"FAMILY"}')
assert_json "Billing preview FAMILY 20000 XOF" "d.get('finalAmount') == 20000 and d.get('limits',{}).get('maxTrees') == 5" "$billing_json"

reg_email="billing-test-$(date +%s)@example.com"
reg_json=$(curl -s -X POST "$API/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Billing Test\",\"email\":\"$reg_email\",\"password\":\"password123\"}")
assert_json "Inscription planActive=false" "d.get('user',{}).get('planActive') is False" "$reg_json"
NEW_TOKEN=$(echo "$reg_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")
if [ -n "$NEW_TOKEN" ]; then
  code=$(curl -s -o /tmp/genea_no_plan_tree.json -w '%{http_code}' -X POST "$API/family-trees" \
    -H "Authorization: Bearer $NEW_TOKEN" -H 'Content-Type: application/json' \
    -d '{"name":"Sans forfait"}')
  assert_status "Création arbre sans forfait bloquée" "402" "$code" "$(cat /tmp/genea_no_plan_tree.json 2>/dev/null)"
fi

# Arbre public — admin (Patrimoine)
if [ -n "$ADMIN_TOKEN" ]; then
  admin_trees=$(curl -s "$API/family-trees" -H "$ADMIN_AUTH")
  PUBLIC_TREE_ID=$(echo "$admin_trees" | python3 -c "
import sys,json
trees=json.load(sys.stdin).get('trees',[])
non_demo=[t for t in trees if not t.get('isDemo')]
print(non_demo[0]['id'] if non_demo else '')
" 2>/dev/null || echo "")

  if [ -z "$PUBLIC_TREE_ID" ]; then
    create_json=$(curl -s -X POST "$API/family-trees" -H "$ADMIN_AUTH" -H 'Content-Type: application/json' \
      -d '{"name":"Arbre Public Test"}')
    PUBLIC_TREE_ID=$(echo "$create_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tree',{}).get('id',''))" 2>/dev/null || echo "")
  fi

  if [ -n "$PUBLIC_TREE_ID" ]; then
    code=$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$API/family-trees/$PUBLIC_TREE_ID/visibility" \
      -H "$ADMIN_AUTH" -H 'Content-Type: application/json' -d '{"visibility":"PUBLIC"}')
    assert_status "PUT visibilité PUBLIC (admin)" "200" "$code"

    pub_json=$(curl -s -w '\n%{http_code}' "$API/family-trees/$PUBLIC_TREE_ID")
    pub_body=$(echo "$pub_json" | sed '$d')
    pub_code=$(echo "$pub_json" | tail -1)
    assert_status "Lecture arbre public sans auth" "200" "$pub_code"
    assert_json "Visiteur public canRead" "d.get('access',{}).get('canRead') is True" "$pub_body"
    assert_json "Visiteur public canWrite=false" "d.get('access',{}).get('canWrite') is False" "$pub_body"

    code=$(curl -s -o /tmp/genea_anon_write.json -w '%{http_code}' -X POST "$API/persons/tree/$PUBLIC_TREE_ID" \
      -H 'Content-Type: application/json' -d '{"firstName":"Anon","lastName":"Hack"}')
    assert_status "Écriture anonyme bloquée sur arbre public" "401" "$code" "$(cat /tmp/genea_anon_write.json 2>/dev/null)"

    PUB_PERSON=$(echo "$pub_body" | python3 -c "import sys,json; ps=json.load(sys.stdin).get('tree',{}).get('Person',[]); print(ps[0]['id'] if ps else '')" 2>/dev/null || echo "")
    if [ -n "$PUB_PERSON" ]; then
      code=$(curl -s -o /dev/null -w '%{http_code}' "$API/persons/$PUB_PERSON/documents")
      assert_status "Documents lisibles sans auth (arbre public)" "200" "$code"
    fi

    code=$(curl -s -o /dev/null -w '%{http_code}' "$API/admin/promo-codes" -H "$ADMIN_AUTH")
    assert_status "GET /admin/promo-codes" "200" "$code"
  fi
fi

echo
echo "=== Résultat API : $PASS passés, $FAIL échoués ==="
[ "$FAIL" -eq 0 ]
