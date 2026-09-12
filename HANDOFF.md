# Handoff — The Engine

> Conditioning only. Strength UI stays a separate site. Nutrition proxy is Edge `off-proxy`.

| | |
| --- | --- |
| **Product** | The Engine — intervals / tempo / steady on row, ski, bike, Echo, fan, walk, run |
| **Storage** | `THE-hybrid-engine-v1` |
| **Math** | `@hybrid/adaptive` — `openCond` / `decideNextCond` / `closeCond` only in the UI |
| **Host** | Supabase `orysjncrksmdfabpuftd` — `functions/v1/www/` |
| **WHOOP / coach** | Edge Functions + `engine.integration_kv` |
| **Not** | Strength TRACK UI, Netlify, GitHub Pages, PlanSync |

GitHub: `reflectprotect123-max/Engine-side-`.

Shared Auth is this project. TRACK (Strength) and Brain are also served from this project (`/functions/v1/strength/`, `/functions/v1/brain/`). WHOOP keys for Engine are `token:whoop:u:<uuid>`; TRACK uses `token:whoop:s:<uuid>`.
