# Hosting — keep Supabase, drop Netlify for The Engine

Live origin (this agent enabled it): **`https://orysjncrksmdfabpuftd.supabase.co/functions/v1/www/`**

GitHub Pages is blocked for the GitHub App token (`pages: create` → resource not accessible). The Engine is hosted on the same Supabase project instead: public bucket `engine-web` + Edge Function `www`.

| Item | Status |
| --- | --- |
| Auth redirects | Pages URL, `localhost:8766`, and `…/functions/v1/www/**` |
| `engine.integration_kv` | Applied |
| Edge Functions | whoop-*, integrations-*, brain-coach, **www** |
| Client | `functionsProvider: 'supabase'`, `publicOrigin` = `www` |
| OpenRouter | Set on the project from the Strength vault |
| WHOOP client id | Set (public OAuth id from the existing Netlify authorize URL) |

WHOOP **client secret** is only on Netlify env (not in git). Connect can start OAuth; token exchange needs that secret on this project, and the WHOOP app’s redirect list must include `https://orysjncrksmdfabpuftd.supabase.co/functions/v1/whoop-callback` (today it is the Netlify callback).
