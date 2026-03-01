#!/usr/bin/env bash
# Full deploy: build → S3 sync with proper cache headers → Cloudflare purge → verify
#
# Cache strategy:
#   - Hashed assets (JS/CSS/fonts/images): immutable, 1 year max-age
#   - Shell files (index.html, sw.js, registerSW.js, manifest, workbox): no-cache
#     → browser always revalidates, picks up new hashed filenames immediately
#   - Cloudflare edge cache: purged after every deploy so edge nodes serve fresh content
#
# Requires: .env.deploy with CF_ZONE_ID and CF_API_TOKEN
# Usage: bash scripts/deploy.sh

set -euo pipefail

BUCKET="s3://woofapp.fi"
DIST="dist"
SITE_URL="https://woofapp.fi"

# Load Cloudflare credentials
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.deploy"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

echo "=== Building ==="
npm run build

echo ""
echo "=== Deploying to S3 ==="

# Step 1: Sync hashed assets with long cache (immutable)
# Exclude the non-hashed shell files — they get separate cache headers
echo "Syncing hashed assets (immutable, 1yr cache)..."
aws s3 sync "$DIST/" "$BUCKET/" \
  --delete \
  --exclude '.DS_Store' \
  --exclude 'index.html' \
  --exclude 'sw.js' \
  --exclude 'registerSW.js' \
  --exclude 'manifest.webmanifest' \
  --exclude 'workbox-*.js' \
  --cache-control 'public, max-age=31536000, immutable'

# Step 2: Upload shell files with no-cache (always revalidate)
# These are the entry points — must be fresh so the browser discovers new hashed filenames
echo "Uploading shell files (no-cache, always revalidate)..."
aws s3 cp "$DIST/index.html" "$BUCKET/index.html" \
  --cache-control 'no-cache, no-store, must-revalidate' \
  --content-type 'text/html'

aws s3 cp "$DIST/sw.js" "$BUCKET/sw.js" \
  --cache-control 'no-cache, no-store, must-revalidate' \
  --content-type 'application/javascript'

aws s3 cp "$DIST/registerSW.js" "$BUCKET/registerSW.js" \
  --cache-control 'no-cache, no-store, must-revalidate' \
  --content-type 'application/javascript'

aws s3 cp "$DIST/manifest.webmanifest" "$BUCKET/manifest.webmanifest" \
  --cache-control 'no-cache, no-store, must-revalidate' \
  --content-type 'application/manifest+json'

# Workbox runtime (non-hashed filename)
for f in "$DIST"/workbox-*.js; do
  if [ -f "$f" ]; then
    BASENAME=$(basename "$f")
    aws s3 cp "$f" "$BUCKET/$BASENAME" \
      --cache-control 'no-cache, no-store, must-revalidate' \
      --content-type 'application/javascript'
  fi
done

echo ""
echo "=== S3 deploy complete ==="
echo "  Shell files: no-cache (browser always revalidates)"
echo "  Hashed assets: immutable, 1yr cache"

# Step 3: Purge Cloudflare edge cache
# This ensures edge nodes serve fresh shell files immediately after deploy
echo ""
echo "=== Purging Cloudflare cache ==="
if [ -n "${CF_ZONE_ID:-}" ] && [ -n "${CF_API_TOKEN:-}" ]; then
  PURGE_RESPONSE=$(curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"files\":[\"${SITE_URL}/index.html\",\"${SITE_URL}/sw.js\",\"${SITE_URL}/registerSW.js\",\"${SITE_URL}/manifest.webmanifest\"]}")

  if echo "$PURGE_RESPONSE" | grep -q '"success":true'; then
    echo "Cloudflare cache purged for shell files"
  else
    echo "WARNING: Cloudflare purge may have failed: $PURGE_RESPONSE"
  fi
else
  echo "SKIPPED: CF_ZONE_ID or CF_API_TOKEN not set in .env.deploy"
  echo "  Create .env.deploy with CF_ZONE_ID and CF_API_TOKEN to enable cache purge"
fi

echo ""
echo "=== Verifying deploy ==="
bash scripts/verify-deploy.sh
