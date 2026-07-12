#!/usr/bin/env bash
#
# Vérifie la connexion à un bucket S3/R2 avec les credentials fournis.
# Usage :
#   export S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
#   export S3_ACCESS_KEY=...
#   export S3_SECRET_KEY=...
#   export S3_BUCKET=geneamap-staging
#   bash scripts/check-r2.sh
#
set -euo pipefail

: "${S3_ENDPOINT:?S3_ENDPOINT requis}"
: "${S3_ACCESS_KEY:?S3_ACCESS_KEY requis}"
: "${S3_SECRET_KEY:?S3_SECRET_KEY requis}"
: "${S3_BUCKET:?S3_BUCKET requis}"
export S3_REGION="${S3_REGION:-auto}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

if [ ! -d "$BACKEND_DIR/node_modules/@aws-sdk/client-s3" ]; then
  echo "✗ @aws-sdk/client-s3 introuvable, lancez 'npm install' dans backend/"
  exit 1
fi

cd "$BACKEND_DIR"

node <<'EOF'
const {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const bucket = process.env.S3_BUCKET;
const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const key = `healthcheck/check-r2-${Date.now()}.txt`;
const body = 'geneamap r2 healthcheck';

function ok(step) { console.log(`  ✓ ${step}`); }
function fail(step, err) {
  const status = err.$metadata?.httpStatusCode;
  console.error(`  ✗ ${step}, ${err.name || ''} ${err.message}${status ? ` (HTTP ${status})` : ''}`);
  if (status === 401 || status === 403) {
    console.error('    → Credentials invalides ou token sans accès à ce bucket.');
  } else if (status === 404) {
    console.error('    → Le bucket n\'existe pas, créez-le dans le dashboard Cloudflare R2.');
  }
  process.exit(1);
}

async function main() {
  console.log(`=== Vérification S3/R2, bucket "${bucket}" ===`);
  console.log(`Endpoint : ${process.env.S3_ENDPOINT}`);

  try { await client.send(new HeadBucketCommand({ Bucket: bucket })); ok('HeadBucket, bucket accessible'); }
  catch (e) { fail('HeadBucket', e); }

  try { await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'text/plain' })); ok('PutObject, écriture'); }
  catch (e) { fail('PutObject', e); }

  try {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await res.Body.transformToString();
    if (text !== body) throw new Error('contenu inattendu');
    ok('GetObject, lecture');
  } catch (e) { fail('GetObject', e); }

  try { await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })); ok('DeleteObject, suppression'); }
  catch (e) { fail('DeleteObject', e); }

  console.log('\n=== Tout est OK, credentials valides ===');
}

main();
EOF
