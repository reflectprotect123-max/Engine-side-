# Hosting

All Hybrid products in this GitHub account run on **one Supabase project**: `orysjncrksmdfabpuftd`.

| Surface | URL | Storage bucket |
| --- | --- | --- |
| The Engine | `https://orysjncrksmdfabpuftd.supabase.co/functions/v1/www/` | `engine-web` |
| TRACK (Strength) | `https://orysjncrksmdfabpuftd.supabase.co/functions/v1/strength/` | `strength-web` |
| Brain / hybrid1 landing | `https://orysjncrksmdfabpuftd.supabase.co/functions/v1/brain/` | `brain-web` |

WHOOP OAuth callback (Engine + TRACK, product is in the pending record):  
`https://orysjncrksmdfabpuftd.supabase.co/functions/v1/whoop-callback`

WHOOP webhook:  
`https://orysjncrksmdfabpuftd.supabase.co/functions/v1/whoop-webhook`

Concept2 Logbook is retired. Ignore any Concept2 OAuth app / Netlify callback.

Open Food Facts proxy:  
`https://orysjncrksmdfabpuftd.supabase.co/functions/v1/off-proxy`

Do not use Netlify or GitHub Pages. Keep the Strength Netlify WHOOP redirect registered until every athlete APK has switched to these URLs, then delete it.

Ship static files:

```bash
SUPABASE_ACCESS_TOKEN=… bash scripts/ship-sites.sh
```
