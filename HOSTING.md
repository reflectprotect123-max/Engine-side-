# Hosting — keep Supabase, drop Netlify for The Engine

Netlify is leftover from the Strength/Brain athlete site. **The Engine does not own it.** Do not delete Strength’s Netlify sites until Strength and Brain have moved.

## Done in this repo / live project

| Item | Status |
| --- | --- |
| Supabase Auth redirect allow-list includes GitHub Pages + local `:8766` | Applied to `orysjncrksmdfabpuftd` (`uri_allow_list`). `site_url` left as-is so Strength email links are not stolen. |
| Private store `engine.integration_kv` | Migration `supabase/migrations/20260912120000_engine_integration_kv.sql` |
| Edge Functions `whoop-connect`, `whoop-callback`, `whoop-sync`, `integrations-status`, `integrations-disconnect`, `brain-coach` | `supabase/functions/` |
| Engine client | `ENGINE_CONFIG.functionsProvider = 'supabase'` |

Pages URL: `https://reflectprotect123-max.github.io/Engine-side-/`

## You still need (cannot be done from this agent)

1. **GitHub Pages** — Settings → Pages → Source: **GitHub Actions** if the workflow still cannot enable it. The workflow now requests `enablement: true`.
2. **WHOOP developer portal** — redirect URI must include `https://orysjncrksmdfabpuftd.supabase.co/functions/v1/whoop-callback`.
3. **Supabase project secrets** (Dashboard → Edge Functions → Secrets, or `supabase secrets set`):
   - `WHOOP_CLIENT_ID`
   - `WHOOP_CLIENT_SECRET`
   - `OPENROUTER_API_KEY` (coach only)
   - `INTEGRATION_ENCRYPT_KEY` (set on first deploy if missing)
   - `ENGINE_PUBLIC_ORIGIN=https://reflectprotect123-max.github.io/Engine-side-`

Until WHOOP client id/secret are on the project, Connect returns `connection_unavailable`. Existing Netlify Blob tokens are **not** copied; athletes reconnect WHOOP once on Engine.

Strength/Brain can keep `thehybridsystem.netlify.app` until they migrate.
