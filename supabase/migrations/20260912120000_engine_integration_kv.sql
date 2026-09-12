-- Private Engine integration store (WHOOP tokens + snapshots).
-- Not Strength's twelve tables. Not exposed to anon/authenticated.
create schema if not exists engine;

create table if not exists engine.integration_kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table engine.integration_kv enable row level security;

revoke all on schema engine from public, anon, authenticated;
grant usage on schema engine to postgres, service_role;
grant all on table engine.integration_kv to postgres, service_role;
