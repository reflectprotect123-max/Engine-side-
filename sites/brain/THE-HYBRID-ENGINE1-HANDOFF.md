# Handoff — THE-HYBRID-ENGINE1

> **AUTHORITATIVE CHECKPOINT — 26 August 2026 (gutted to a schema stub).**
> This repository is now a **schema stub with no product**. The product is
> `reflectprotect123-max/strengthside` (the Hybrid HTML athlete app + the pure
> `@hybrid/strength-engine`). This repo owns only the shared-Supabase migrations
> the strength repo does not own, plus the one check that proves they apply.

## What this repo is now

```
supabase/migrations/            20 migrations — the shared-Supabase ledger this
                                repo owns (auth helpers, nutrition domain
                                history, legacy coach/ARC relationship SQL).
checks/migrations-apply.mjs     applies them all to a throwaway Postgres and
                                writes through the RPCs (RLS + domain proof).
checks/sql/supabase-prelude.sql the Supabase project parts the migrations assume
                                exist (auth schema, roles, request-scoped
                                auth.uid()).
.github/workflows/ci.yml        one job: run migrations-apply on a real Postgres.
package.json                    no dependencies; `verify` = migrations-apply.
README.md / CLAUDE.md           schema-stub description + operating contract.
```

## What was removed on 26 August 2026, and why

Scope here was cut to the shared-DB migrations. Everything that made this a
product was deleted; git history holds all of it.

- **`apps/`** — the Android athlete app (`apps/mobile`) and the coach web
  workspace (`apps/web`). The athlete product lives in `strengthside` now.
- **`packages/`** — every engine and shared package (`engine`, `shared-core`,
  `whole-athlete-state`, `product-scope`, `nutrition-*`, `design`, `config`,
  `guided-flow`). Strength already moved to `strengthside` on 21 August 2026.
- **Coach design** — the `Train heroic UIUX coach design/` kit.
- **Netlify** — `netlify/functions/` (WHOOP/Concept2 OAuth + webhooks),
  `netlify.toml`, `_headers`, `_redirects`, `privacy.html`, `.well-known/`, and
  the site assets (`icons/`, `fonts/`). The `scripts/` build/deploy assembly
  went with them.
- **EAS/OTA/e2e workflows** — `.github/workflows/mobile-eas.yml`,
  `mobile-ota.yml` and `sync-e2e.yml`.
- **Other checks** — every `checks/*.mjs` except `migrations-apply.mjs`, the
  `checks/fixtures/` tree, and the staging-verification SQL. The browser
  suites, contract suites, coach/screens/touch checks and their helpers all
  described products that no longer exist here.
- **Docs and tooling noise** — `docs/`, `.claude/`, `skills.md`,
  `supabase-schema.sql` (the legacy app_state JSON snapshot),
  `tsconfig.base.json`, `pnpm-workspace.yaml` and `pnpm-lock.yaml`. With no
  packages and a zero-dependency check, none are needed.

## The shared-Supabase contract (unchanged, still binding)

- **`strengthside` owns twelve strength tables** — `metric`, `equipment`,
  `exercise`, `strength_block_item`, `prescribed_set`, `prescribed_target`,
  `assigned_session`, `performed_set`, `performed_measurement`,
  `working_max_event`, `pr_event`, `coaching_note` — plus their RLS and
  `embed-coaching-note`.
- **This stub owns everything else** in the shared ledger, including `auth`,
  the coach/athlete relationship model and `coaches_athlete_anywhere`.
- Neither repo migrates the other's tables. Filename timestamps are the shared
  ordering — never renumber or rename a pushed migration. A change to
  `coaches_athlete_anywhere`'s signature must be coordinated by hand.
- The coach/ARC tables here are **frozen legacy**: they keep the ledger
  applying, they are not a coaching product to revive.

## Verification at this checkpoint

`node checks/migrations-apply.mjs` — **all migration checks passed** (188 PASS,
0 FAIL) against a throwaway Postgres 16 cluster: all 20 migrations apply in
order, and the RLS/RPC assertions (domain snapshots, food-catalogue isolation,
ARC erasure, invites, week publish, held receipts, end-of-coaching, bootstrap)
hold for two impersonated athletes. CI runs exactly this.

## Companion: strengthside PR #55

`strengthside` PR #55 ("Document hybrid companion as schema stub (no
coaching)") is the docs pointer on the product side: it updates that repo's
`CLAUDE.md` and `handoff.md` to name this repo as the schema stub and reaffirm
the shared-DB contract. It should track this gut.
