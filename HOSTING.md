# Hosting — keep Supabase, drop Netlify for The Engine

Netlify is leftover from the Strength/Brain athlete site. **The Engine does not own it.** Do not delete Strength’s Netlify sites until Strength and Brain have moved; this repo just stops depending on them.

## Keep (Supabase)

Project **The hybrid engine** — `orysjncrksmdfabpuftd` (`https://orysjncrksmdfabpuftd.supabase.co`).

| Use | What to do |
| --- | --- |
| Login | Keep Auth. Browser uses the **anon** key in `engine-config.js` only. |
| Management PAT | Cursor / CI secret `SUPABASE_ACCESS_TOKEN`. Never git, never `environment.json`, never the install script. |
| Engine sessions | Device `localStorage` key `THE-hybrid-engine-v1` stays source of truth. |
| Tables | Do **not** run Strength’s twelve-table migrations from this repo. Optional later: **new** Engine tables + RLS on the same project. THE-HYBRID-ENGINE1 owns the rest of the shared ledger. |

After Pages is live, add the Pages URL to Auth → URL configuration → Redirect URLs (and Site URL if you want that as the primary).

Expected origin: `https://reflectprotect123-max.github.io/Engine-side-/`

## Replace (Netlify → Pages)

1. Merge this repo to `main`.
2. GitHub → Settings → Pages → **Build and deployment → GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` publishes `_site` (HTML/CSS/JS only — not `.cursor/skills`).
4. Open the Pages URL. Conditioning Open/Next/Close does not need Netlify.

## Leftover WHOOP / coach (still Netlify until you say otherwise)

Me-tab WHOOP and “Talk to coach” still call `thehybridsystem.netlify.app/.netlify/functions/…` when `ENGINE_CONFIG.functionsProvider` is `netlify-legacy` (`engine-config.js`).

To finish cutting the cord:

1. Copy WHOOP/Concept2 OAuth + token store from Brain Netlify functions + Blobs into **Supabase Edge Functions** + a private table (or Vault). Authorize with the user’s Auth JWT.
2. Move WHOOP client id/secret (and OpenRouter if Brain follows) from Netlify env → Supabase project secrets.
3. Set `functionsProvider: 'supabase'` in `engine-config.js`.
4. Or delete the leftover Me/WHOOP/coach chrome if Engine should not own integrations.

Do not apply those functions or migrations to the live project from a cloud agent unless you explicitly ask to mutate production.
