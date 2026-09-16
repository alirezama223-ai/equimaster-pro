alter table public.reminders
  add column if not exists horse_id uuid references public.horse_listings(id) on delete set null;

create index if not exists reminders_horse_id_due_at_idx
  on public.reminders(horse_id, due_at asc);

comment on column public.reminders.horse_id is 'Optional horse associated with this stable reminder.';
