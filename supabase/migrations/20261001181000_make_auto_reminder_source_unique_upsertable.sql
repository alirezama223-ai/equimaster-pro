drop index if exists public.reminders_auto_source_unique;

create unique index reminders_auto_source_unique
  on public.reminders (user_id, source_type, source_id, rule_key);
