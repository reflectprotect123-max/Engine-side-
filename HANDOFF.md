# Handoff — The Engine

> Conditioning only. TRACK is Strength. Nutrition proxy is Edge `off-proxy`. Netlify is gone.

| | |
| --- | --- |
| **Product** | The Engine — intervals / tempo / steady on row, ski, bike, Echo, fan, walk, run |
| **Storage** | `THE-hybrid-engine-v1` |
| **Math** | `@hybrid/adaptive` — `openCond` / `decideNextCond` / `closeCond` only in the UI |
| **Host** | Supabase `orysjncrksmdfabpuftd` — `functions/v1/www/` |
| **WHOOP / coach** | Edge Functions + `engine.integration_kv` (`token:whoop:u:<uuid>`) |
| **Not** | Strength TRACK UI, Netlify, GitHub Pages, PlanSync, Concept2 Logbook |

GitHub: `reflectprotect123-max/Engine-side-`.

TRACK (Strength) is `functions/v1/strength/` — WHOOP keys `token:whoop:s:<uuid>`. Brain landing is `functions/v1/brain/`. Same Auth project.

**Live**

| Surface | URL |
| --- | --- |
| Engine | https://orysjncrksmdfabpuftd.supabase.co/functions/v1/www/ |
| TRACK | https://orysjncrksmdfabpuftd.supabase.co/functions/v1/strength/ |
| Brain | https://orysjncrksmdfabpuftd.supabase.co/functions/v1/brain/ |
| WHOOP callback | https://orysjncrksmdfabpuftd.supabase.co/functions/v1/whoop-callback |
| WHOOP webhook | https://orysjncrksmdfabpuftd.supabase.co/functions/v1/whoop-webhook |
| WHOOP portal | https://developer-dashboard.whoop.com/ |

WHOOP dashboard must list **only** those two Edge URLs. Concept2 is retired. `thehybridsystem.netlify.app` and `thehybridengine1.netlify.app` are 404.

`whoop.ts` imports `whoopCallbackUrl()` from `_shared/auth.ts`. Dropping that export boots `whoop-callback` into HTTP 503 `BOOT_ERROR` (OAuth return dies). Restore the helper, then redeploy `whoop-callback` and `whoop-connect`.

Sibling GitHub repos: `strengthside`, `THE-HYBRID-ENGINE1`. `nutrition` / `the-brain` 404 for this token.

Capgo: Engine `com.hybrid.engine`. TRACK `com.hybrid.athlete` (bundle **1.0.82** on live + dogfood, Supabase WHOOP).

---

## Installed from GitHub (Cloud Agent VM)

These live on the agent box (`~/.cursor/skills`, plus CLIs). They are **not** Engine product code. A new agent only keeps them if the personal environment snapshot was Saved.

| Install | Source | Version / note |
| --- | --- | --- |
| Obsidian | [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) `v1.13.7` `.deb` | `obsidian` → 1.13.7 |
| Graphify | [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) via PyPI `graphifyy` | `graphify` 0.9.58 (`graphify-mcp` too) |
| Graphify Cursor skill | same; `graphify install --platform cursor` | `~/.cursor/skills/graphify` |
| Caveman family | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | `caveman`, `caveman-commit`, `caveman-compress`, `caveman-help`, `caveman-review`, `caveman-stats`, `cavecrew` |
| Awesome design.md | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) / [aradotso/trending-skills](https://github.com/aradotso/trending-skills) | `awesome-design-md` |
| Superpowers process skills | Cursor plugin cache `cursor-public` (obra superpowers set) | `using-superpowers`, `brainstorming`, `systematic-debugging`, `test-driven-development`, `writing-plans`, `writing-skills`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `verification-before-completion`, `finishing-a-development-branch`, `using-git-worktrees`, `requesting-code-review`, `receiving-code-review` |
| Wiki / Obsidian vault | claude-obsidian portable core (skill tree) | `wiki`, `wiki-cli`, `wiki-fold`, `wiki-ingest`, `wiki-lint`, `wiki-mode`, `wiki-query`, `wiki-retrieve`, `obsidian-markdown`, `obsidian-bases` |
| Design / UI | various GitHub design systems (see each SKILL.md) | `design`, `design-system`, `design-taste-frontend`, `frontend-design`, `web-design-guidelines`, `ui-styling`, `ui-ux-pro-max`, `brand`, `banner-design`, `image-to-code`, `slides` |
| Supabase | [supabase/cli](https://github.com/supabase/cli) docs + skill pack | `supabase`, `supabase-postgres-best-practices` |
| Other agent skills | installed on this VM | `autoresearch`, `canvas`, `defuddle`, `install-skill`, `mem-search`, `save`, `session-start-hook`, `think` |

**54** skills under `~/.cursor/skills`. Cursor-native ones (`env-setup`, `subscribe`, `canvas` product, `walkthrough-artifacts`, `migrate-to-builds`) stay with Cursor — not copied.

Graphify: `graphify . --obsidian` writes `graphify-out/obsidian/` for Obsidian “Open folder as vault”.
