#!/usr/bin/env bash
# Post-deploy verification: checks that the live frontend JS bundle
# contains the expected git commit hash.
#
# Usage: bash scripts/verify-deploy.sh [expected_commit]
#   If expected_commit is omitted, uses current HEAD.

set -euo pipefail

EXPECTED_COMMIT="${1:-$(git rev-parse --short HEAD)}"
SITE_URL="https://woofapp.fi"
MAX_RETRIES=6
RETRY_DELAY=10  # seconds (CloudFront can take a moment)

echo "Verifying frontend deploy: expecting commit $EXPECTED_COMMIT"

# Step 1: Find the main JS bundle URL from index.html
echo "Fetching $SITE_URL ..."

for i in $(seq 1 $MAX_RETRIES); do
    # Get index.html and extract the main JS bundle path
    INDEX_HTML=$(curl -sf -H "User-Agent: Mozilla/5.0 deploy-verify" "$SITE_URL" 2>/dev/null || echo '')
    JS_PATH=$(echo "$INDEX_HTML" | node -e "
        let d='';process.stdin.on('data',c=>d+=c);
        process.stdin.on('end',()=>{const m=d.match(/src=\"(\/js\/main-[^\"]+)\"/);console.log(m?m[1]:'')})
    ")

    if [ -z "$JS_PATH" ]; then
        echo "  Attempt $i/$MAX_RETRIES: could not find JS bundle in index.html — retrying..."
        sleep $RETRY_DELAY
        continue
    fi

    # Step 2: Fetch the JS bundle and check if the commit hash is present
    JS_URL="${SITE_URL}${JS_PATH}"
    JS_CONTENT=$(curl -sf -H "User-Agent: Mozilla/5.0 deploy-verify" "$JS_URL" 2>/dev/null || echo '')

    # The commit hash is injected by Vite define as a string literal: "abc1234"
    if echo "$JS_CONTENT" | grep -q "\"$EXPECTED_COMMIT\""; then
        LIVE_COMMIT="$EXPECTED_COMMIT"
    else
        LIVE_COMMIT="unknown"
    fi

    if [ "$LIVE_COMMIT" = "$EXPECTED_COMMIT" ]; then
        echo ""
        echo "Frontend deploy verified!"
        echo "  Commit:  $LIVE_COMMIT"
        echo "  Bundle:  $JS_PATH"
        exit 0
    fi

    echo "  Attempt $i/$MAX_RETRIES: live=$LIVE_COMMIT, expected=$EXPECTED_COMMIT — retrying in ${RETRY_DELAY}s..."
    sleep $RETRY_DELAY
done

echo ""
echo "FRONTEND DEPLOY VERIFICATION FAILED"
echo "  Expected commit: $EXPECTED_COMMIT"
echo "  Live commit:     $LIVE_COMMIT"
echo "  CloudFront may still be serving cached content."
echo "  Try invalidating the cache or waiting a few minutes."
exit 1
