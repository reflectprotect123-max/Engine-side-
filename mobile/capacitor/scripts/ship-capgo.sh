#!/usr/bin/env bash
# Ship Engine www to Capgo live + dogfood. Never uploads to com.hybrid.athlete.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../.." && pwd)"
VERSION="${CAPGO_BUNDLE_VERSION:-}"
APP_ID="${CAPGO_APP_ID:-com.hybrid.engine}"
CHANNELS="${CAPGO_CHANNELS:-dogfood,live}"

if [[ -z "${CAPGO_TOKEN:-}" && -f /tmp/engine.capgo ]]; then
  CAPGO_TOKEN="$(tr -d '\n' </tmp/engine.capgo)"
fi
if [[ -z "${CAPGO_TOKEN:-}" && -f "$REPO/.capgo" ]]; then
  CAPGO_TOKEN="$(tr -d '\n' <"$REPO/.capgo")"
fi
if [[ -z "${CAPGO_TOKEN:-}" ]]; then
  echo "ship-capgo: FAIL — set CAPGO_TOKEN or create $REPO/.capgo" >&2
  exit 1
fi
if [[ -z "$VERSION" ]]; then
  echo "ship-capgo: FAIL — set CAPGO_BUNDLE_VERSION" >&2
  exit 1
fi
if [[ "$APP_ID" == "com.hybrid.athlete" ]]; then
  echo "ship-capgo: FAIL — refusing to upload Engine onto Strength Capgo app" >&2
  exit 1
fi

bash "$REPO/scripts/assemble-pages.sh" "$ROOT/www"
cd "$ROOT"
echo "ship-capgo: upload $VERSION → $APP_ID channels=$CHANNELS"
npx --yes @capgo/cli@latest bundle upload "$APP_ID" \
  --apikey "$CAPGO_TOKEN" \
  --path www \
  --channel "$CHANNELS" \
  --bundle "$VERSION" \
  --comment "engine $VERSION"

npx --yes @capgo/cli@latest channel set live "$APP_ID" --apikey "$CAPGO_TOKEN" --bundle "$VERSION"
npx --yes @capgo/cli@latest channel set dogfood "$APP_ID" --apikey "$CAPGO_TOKEN" --bundle "$VERSION"
echo "ship-capgo: done ($VERSION on $CHANNELS)."
