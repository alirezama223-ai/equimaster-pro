alter table public.reminders
  add column if not exists competition_id uuid references public.competitions(id) on delete cascade;

create index if not exists reminders_competition_id_idx
  on public.reminders (competition_id);
