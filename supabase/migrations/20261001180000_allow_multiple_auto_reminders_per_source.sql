drop index if exists public.reminders_auto_source_unique;

create unique index reminders_auto_source_unique
  on public.reminders (user_id, source_type, source_id, rule_key)
  where auto_generated = true
    and source_type is not null
    and source_id is not null
    and rule_key is not null;
