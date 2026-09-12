# engineside — The Engine

Conditioning product. **Not Strength.** Sibling of `strengthside` and `nutrition` — own repo, own storage (`THE-hybrid-engine-v1`), own logger (splits / watts / RPM).

This tree is **not** a 1:1 copy of the Strength athlete app. The first HTML shell was forked from that app so Open/Next/Close had a door; Home/WHOOP/FAB chrome is leftover to replace, not a feature of Strength.

Do not merge this back into `apps/athlete/` or `apps/engine/` on strengthside.

## Layout

| Path | Role |
| --- | --- |
| `index.html` `app.js` `engine.js` | Engine HTML product |
| `packages/adaptive/` | `@hybrid/adaptive` cond Open/Next/Close |
| `scripts/bundle-adaptive.mjs` | IIFE → `adaptive-bundle.js` |

## Hosting

Keep **Supabase** project `orysjncrksmdfabpuftd` (Auth + optional later Engine tables). Static site: **GitHub Pages**, not Netlify. See `HOSTING.md`.

## Play

```bash
pnpm install
pnpm run verify
python3 -m http.server 8766
```

## Out

- Strength TRACK kg/reps
- `PlanSync` / `strength_side`
- `apps/hybrid-engine/` (recall-forbidden name on strengthside)
