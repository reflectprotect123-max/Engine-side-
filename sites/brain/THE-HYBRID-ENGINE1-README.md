# THE-HYBRID-ENGINE1 — schema stub

**This repository is a schema stub. It has no product.** The product is
[`reflectprotect123-max/strengthside`](https://github.com/reflectprotect123-max/strengthside)
— the Hybrid HTML athlete app plus the pure `@hybrid/strength-engine`.

What lives here is the half of one shared Supabase project's migration ledger
that the strength repo does not own: the `auth` helpers, the nutrition domain
history, and the legacy coach/ARC relationship SQL (`coaches_athlete_anywhere`
and the ARC workspace, roster, week-publish and receipt tables). Those objects
stay in Postgres as **frozen legacy** so the shared ledger keeps applying in
order — they are not a coaching product to revive.

Everything that made this a product was removed on 26 August 2026: `apps/`
(the Android athlete app and the coach web workspace), every `packages/*`
engine, the coach design kit, the Netlify site and its functions, the EAS and
OTA workflows, and every check except the one that proves the migrations still
apply. Git history holds all of it.

## Layout

```
supabase/migrations/            the shared-Supabase migrations this repo owns.
checks/migrations-apply.mjs     applies them all to a throwaway Postgres and
                                writes through the RPCs to prove RLS and the
                                domain constraints behave.
checks/sql/supabase-prelude.sql the parts of a Supabase project the migrations
                                assume already exist (auth schema, roles,
                                request-scoped auth.uid()).
```

## Verifying it

```bash
node checks/migrations-apply.mjs   # or: pnpm run verify
```

It builds its own throwaway Postgres cluster, applies every migration in
`supabase/migrations/` in filename order after the prelude, then impersonates
two distinct athletes to assert the RLS boundary empirically. It needs
`initdb`/`pg_ctl`/`psql` on `PATH` and **skips** (exit 0) if no local Postgres
is found — CI turns that skip into a hard error so the check can never silently
verify nothing. There are no dependencies to install; it is plain Node.

`.github/workflows/ci.yml` runs exactly this on every push and pull request.

## The shared-Supabase contract — binds BOTH repos

Both repositories write migrations against **one** Postgres:

- **`strengthside` owns exactly twelve tables** — `metric`, `equipment`,
  `exercise`, `strength_block_item`, `prescribed_set`, `prescribed_target`,
  `assigned_session`, `performed_set`, `performed_measurement`,
  `working_max_event`, `pr_event`, `coaching_note` — plus their RLS and the
  `embed-coaching-note` edge function.
- **This stub owns everything else** in the shared ledger, including `auth`,
  the coach/athlete relationship model and `coaches_athlete_anywhere`.
- **Neither repo writes a migration against the other's tables.** A migration
  here touching a strength table is a contract violation, and vice versa.
- A change to `coaches_athlete_anywhere`'s signature is a breaking change for
  the strength repo's RLS and must be coordinated by hand. There is no
  automated guard; the shared database will not warn you.
- **Migration filename timestamps are the shared ordering.** Do not renumber,
  and never rename a migration that has been pushed.

See [`CLAUDE.md`](CLAUDE.md) for the operating contract and [`handoff.md`](handoff.md)
for the checkpoint.
