# Handoff — The Engine

> Conditioning only. Strength lives in `reflectprotect123-max/strengthside`. Nutrition lives in `reflectprotect123-max/nutrition`.

| | |
| --- | --- |
| **Product** | The Engine — intervals / tempo / steady on row, ski, bike, Echo, fan, walk, run |
| **Storage** | `THE-hybrid-engine-v1` |
| **Math** | `@hybrid/adaptive` — `openCond` / `decideNextCond` / `closeCond` only in the UI |
| **Not** | Strength TRACK, silent plan sync, HPP demo plan |

GitHub: `reflectprotect123-max/Engine-side-`.

## Hosting + data (no Netlify)

Netlify is leftover from the Strength/Brain athlete fork. **The Engine does not own it.**

| Job today | Where it lives | Engine replacement |
| --- | --- | --- |
| Static HTML | `thehybridsystem.netlify.app` | **GitHub Pages** from this repo (`index.html` at root). Workflow: `.github/workflows/pages.yml`. |
| Login / session | Supabase Auth on `orysjncrksmdfabpuftd` | **Keep.** Browser uses the **anon** key only. Management PAT stays an environment secret, never in git. |
| Engine sessions / templates | `localStorage` key `THE-hybrid-engine-v1` | **Keep as source of truth on device.** Optional later: an Engine domain snapshot on the same Supabase project (own tables + RLS). Do not write Strength’s twelve tables. |
| WHOOP + Concept2 OAuth + token vault | Brain owner Netlify functions + **Netlify Blobs** (`hybrid-integrations`) | **Supabase Edge Functions** + a private table (or Vault), JWT from Auth. Until that ships, `connectors/whoop.js` still calls `/.netlify/functions/*` on the athlete Netlify site — leftover chrome, not the product. |
| OpenRouter coach | Brain owner Netlify (`brain-coach`) | Not Engine. Leave on Brain until Brain moves; Engine Home “coach” is fork leftover. |

### Get off Netlify (order)

1. **Host Engine on GitHub Pages** (this repo). Enable Pages → GitHub Actions. Origin: `https://reflectprotect123-max.github.io/Engine-side-/`. Add that URL to Supabase Auth redirect allow-list. Details: `HOSTING.md`.
2. **Stop proxying WHOOP/coach through Netlify** in this tree: either drop the leftover Me/WHOOP chrome, or port those functions to Edge Functions and set `ENGINE_CONFIG.functionsProvider` to `'supabase'` in `engine-config.js`.
3. **Move secrets** (WHOOP client id/secret, OpenRouter if Brain follows) from Netlify env → Supabase project secrets. Do not put them in `environment.json` or the client.
4. Strengthside / Brain can keep Netlify until they migrate; Engine must not depend on `thehybridsystem.netlify.app` once steps 1–2 are done.

Shared-Supabase contract still holds: Strength owns twelve tables; THE-HYBRID-ENGINE1 owns the rest of the ledger. Engine adds **new** objects only, never Strength migrations.
