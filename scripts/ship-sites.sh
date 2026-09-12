#!/usr/bin/env bash
# Assemble + upload public sites to Supabase Storage, then the www/strength/brain Edge
# functions can serve them. Requires SUPABASE_ACCESS_TOKEN.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${SUPABASE_PROJECT_REF:-orysjncrksmdfabpuftd}"
API="https://api.supabase.com/v1"
if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "ship-sites: SUPABASE_ACCESS_TOKEN missing" >&2
  exit 1
fi

KEYS_JSON_FILE="$(mktemp)"
curl -fsS -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" "$API/projects/$REF/api-keys" > "$KEYS_JSON_FILE"
SERVICE_KEY="$(python3 - <<PY
import json
data=json.load(open("$KEYS_JSON_FILE"))
items=data if isinstance(data,list) else data.get("keys") or data.get("api_keys") or []
for row in items:
    name=(row.get("name") or "").lower()
    key=row.get("api_key") or ""
    if key and name=="service_role":
        print(key)
        break
else:
    raise SystemExit("no service_role key")
PY
)"

PROJECT_URL="https://${REF}.supabase.co"
STORAGE="$PROJECT_URL/storage/v1"

ensure_bucket() {
  local bucket="$1"
  curl -sS -o /tmp/bucket.json -w "%{http_code}" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "apikey: $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$bucket\",\"public\":true,\"file_size_limit\":52428800}" \
    "$STORAGE/bucket" >/tmp/bucket.status || true
  echo "bucket $bucket create status=$(cat /tmp/bucket.status)"
}

upload_tree() {
  local bucket="$1"
  local dir="$2"
  python3 - "$STORAGE" "$SERVICE_KEY" "$bucket" "$dir" <<'PY'
import os, sys, mimetypes, urllib.request, urllib.error
storage, key, bucket, root = sys.argv[1:5]
ok = 0
for dirpath, _, files in os.walk(root):
    for name in files:
        path = os.path.join(dirpath, name)
        rel = os.path.relpath(path, root).replace('\\','/')
        mime = mimetypes.guess_type(name)[0] or 'application/octet-stream'
        if name.endswith('.js'): mime = 'text/javascript; charset=utf-8'
        if name.endswith('.css'): mime = 'text/css; charset=utf-8'
        if name.endswith('.html'): mime = 'text/html; charset=utf-8'
        data = open(path, 'rb').read()
        url = f"{storage}/object/{bucket}/{rel}"
        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header('Authorization', f'Bearer {key}')
        req.add_header('apikey', key)
        req.add_header('Content-Type', mime)
        req.add_header('x-upsert', 'true')
        try:
            with urllib.request.urlopen(req) as res:
                res.read()
                ok += 1
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', 'replace')
            # upsert via PUT if POST exists
            req2 = urllib.request.Request(url, data=data, method='PUT')
            for h,v in req.header_items():
                req2.add_header(h, v)
            try:
                with urllib.request.urlopen(req2) as res:
                    res.read()
                    ok += 1
            except Exception as e2:
                print(f'FAIL {rel} {e.code} {body[:200]} / {e2}', file=sys.stderr)
                sys.exit(1)
print(f'uploaded {ok} objects to {bucket}')
PY
}

bash "$ROOT/scripts/assemble-pages.sh" "$ROOT/_site/engine"
ensure_bucket engine-web
ensure_bucket strength-web
ensure_bucket brain-web
upload_tree engine-web "$ROOT/_site/engine"
upload_tree strength-web "$ROOT/sites/strength"
upload_tree brain-web "$ROOT/sites/brain"
echo "ship-sites: ok $PROJECT_URL"
