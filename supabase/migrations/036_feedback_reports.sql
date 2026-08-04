-- EquiMaster Pro Sprint 11.7: Beta feedback reports
-- Run manually in Supabase Dashboard → SQL Editor.

create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reporter_email text,
  category text not null check (category in ('bug', 'suggestion', 'feature_request')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  description text not null,
  page_path text not null,
  browser text not null default '',
  os text not null default '',
  locale text not null default 'en',
  screenshot_url text,
  screenshot_storage_path text,
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'resolved', 'closed')
  ),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_reports_description_not_blank check (length(trim(description)) > 0),
  constraint feedback_reports_page_path_not_blank check (length(trim(page_path)) > 0)
);

create index if not exists feedback_reports_user_id_idx
  on public.feedback_reports (user_id, created_at desc);

create index if not exists feedback_reports_status_idx
  on public.feedback_reports (status, created_at desc);

create index if not exists feedback_reports_category_idx
  on public.feedback_reports (category, created_at desc);

create index if not exists feedback_reports_created_at_idx
  on public.feedback_reports (created_at desc);

create or replace function public.set_feedback_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists feedback_reports_updated_at on public.feedback_reports;
create trigger feedback_reports_updated_at
before update on public.feedback_reports
for each row
execute function public.set_feedback_reports_updated_at();

alter table public.feedback_reports enable row level security;

drop policy if exists "Users can insert own feedback reports" on public.feedback_reports;
create policy "Users can insert own feedback reports"
on public.feedback_reports
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can read own feedback reports" on public.feedback_reports;
create policy "Users can read own feedback reports"
on public.feedback_reports
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can update feedback reports" on public.feedback_reports;
create policy "Admins can update feedback reports"
on public.feedback_reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.feedback_reports to authenticated;

-- ---------------------------------------------------------------------------
-- feedback-screenshots storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-screenshots',
  'feedback-screenshots',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read feedback screenshots" on storage.objects;
create policy "Public read feedback screenshots"
on storage.objects
for select
to public
using (bucket_id = 'feedback-screenshots');

drop policy if exists "Users upload own feedback screenshots" on storage.objects;
create policy "Users upload own feedback screenshots"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'feedback-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own feedback screenshots" on storage.objects;
create policy "Users update own feedback screenshots"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'feedback-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'feedback-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own feedback screenshots" on storage.objects;
create policy "Users delete own feedback screenshots"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'feedback-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);
