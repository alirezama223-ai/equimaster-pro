-- EquiMaster Pro: Smart Saved Search Alerts v1
-- Tracks the last time a saved search was opened so new active matches can be counted.

alter table public.saved_searches
  add column if not exists last_checked_at timestamptz not null default now();

create index if not exists saved_searches_last_checked_at_idx
  on public.saved_searches (last_checked_at);
