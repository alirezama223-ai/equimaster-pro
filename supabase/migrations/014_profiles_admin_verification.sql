-- EquiMaster Pro: profiles/roles + admin verification controls
-- Run this manually in Supabase Dashboard → SQL Editor.
--
-- Creates public.profiles (user/admin roles), protects verified columns on
-- breeders and stallions, and adds admin SELECT/UPDATE policies.
-- Does NOT assign any user as admin — see manual bootstrap SQL in docs.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

insert into public.profiles (user_id, role)
select id, 'user'
from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.protect_breeder_verified()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified := false;
  elsif tg_op = 'UPDATE' then
    new.verified := old.verified;
  end if;

  return new;
end;
$$;

drop trigger if exists breeders_protect_verified on public.breeders;
create trigger breeders_protect_verified
before insert or update on public.breeders
for each row
execute function public.protect_breeder_verified();

create or replace function public.protect_stallion_verified()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified := false;
  elsif tg_op = 'UPDATE' then
    new.verified := old.verified;
  end if;

  return new;
end;
$$;

drop trigger if exists stallions_protect_verified on public.stallions;
create trigger stallions_protect_verified
before insert or update on public.stallions
for each row
execute function public.protect_stallion_verified();

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

-- Admin management reads (non-archived/active directory entities)
drop policy if exists "Admins can read all breeders" on public.breeders;
create policy "Admins can read all breeders"
on public.breeders
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read all stallions" on public.stallions;
create policy "Admins can read all stallions"
on public.stallions
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update breeders" on public.breeders;
create policy "Admins can update breeders"
on public.breeders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can update stallions" on public.stallions;
create policy "Admins can update stallions"
on public.stallions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.profiles to authenticated;
