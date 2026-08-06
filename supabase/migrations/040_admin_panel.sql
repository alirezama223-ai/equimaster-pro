-- EquiMaster Pro: admin panel extensions (seller verification, settings, profile admin updates)

alter table public.profiles
  add column if not exists seller_verified boolean not null default false;

create index if not exists profiles_seller_verified_idx
  on public.profiles (seller_verified)
  where seller_verified = true;

create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create or replace function public.set_admin_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_settings_updated_at on public.admin_settings;
create trigger admin_settings_updated_at
before update on public.admin_settings
for each row
execute function public.set_admin_settings_updated_at();

alter table public.admin_settings enable row level security;

drop policy if exists "Admins can read admin settings" on public.admin_settings;
create policy "Admins can read admin settings"
on public.admin_settings
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can upsert admin settings" on public.admin_settings;
create policy "Admins can upsert admin settings"
on public.admin_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.admin_settings to authenticated;

insert into public.admin_settings (key, value)
values
  (
    'marketplace',
    jsonb_build_object(
      'maintenance_mode', false,
      'require_listing_review', false,
      'support_email', 'support@equimaster.pro',
      'welcome_message', 'Welcome to EquiMaster Pro.'
    )
  )
on conflict (key) do nothing;
