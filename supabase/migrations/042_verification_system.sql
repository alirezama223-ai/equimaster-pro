-- EquiMaster Pro: production verification system (sellers, horses, documents, audit)

-- ---------------------------------------------------------------------------
-- Seller verification status normalization
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_seller_verification_status_check;

update public.profiles
set seller_verification_status = case seller_verification_status
  when 'none' then 'unverified'
  when 'approved' then 'verified'
  when 'more_info' then 'pending'
  else seller_verification_status
end;

alter table public.profiles
  add constraint profiles_seller_verification_status_check
  check (seller_verification_status in ('unverified', 'pending', 'verified', 'rejected'));

alter table public.profiles
  add column if not exists phone_verified boolean not null default false,
  add column if not exists seller_rejection_reason text,
  add column if not exists seller_verified_at timestamptz,
  add column if not exists seller_verified_by uuid references auth.users (id) on delete set null;

update public.profiles
set seller_verified = (seller_verification_status = 'verified')
where seller_verified is distinct from (seller_verification_status = 'verified');

-- ---------------------------------------------------------------------------
-- Horse verification columns
-- ---------------------------------------------------------------------------
alter table public.horse_listings
  add column if not exists horse_verification_status text not null default 'unverified'
    check (horse_verification_status in ('unverified', 'documents_submitted', 'verified')),
  add column if not exists horse_verified_at timestamptz,
  add column if not exists horse_verified_by uuid references auth.users (id) on delete set null,
  add column if not exists owner_seller_verified boolean not null default false;

update public.horse_listings hl
set owner_seller_verified = coalesce(p.seller_verified, false)
from public.profiles p
where p.user_id = hl.user_id;

update public.horse_listings
set verified = (horse_verification_status = 'verified')
where verified is distinct from (horse_verification_status = 'verified');

create index if not exists horse_listings_horse_verification_status_idx
  on public.horse_listings (horse_verification_status, status);

create index if not exists horse_listings_owner_seller_verified_idx
  on public.horse_listings (owner_seller_verified, status)
  where owner_seller_verified = true;

-- ---------------------------------------------------------------------------
-- Verification documents
-- ---------------------------------------------------------------------------
create table if not exists public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  horse_listing_id uuid references public.horse_listings (id) on delete cascade,
  subject_type text not null check (subject_type in ('seller', 'horse')),
  document_type text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  notes text,
  uploaded_at timestamptz not null default now(),
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verification_documents_subject_check check (
    (subject_type = 'seller' and horse_listing_id is null)
    or (subject_type = 'horse' and horse_listing_id is not null)
  )
);

create index if not exists verification_documents_owner_idx
  on public.verification_documents (owner_user_id, subject_type);

create index if not exists verification_documents_listing_idx
  on public.verification_documents (horse_listing_id, subject_type)
  where horse_listing_id is not null;

create index if not exists verification_documents_status_idx
  on public.verification_documents (status, subject_type);

create unique index if not exists verification_documents_unique_slot_idx
  on public.verification_documents (
    owner_user_id,
    coalesce(horse_listing_id, '00000000-0000-0000-0000-000000000000'::uuid),
    subject_type,
    document_type
  );

-- ---------------------------------------------------------------------------
-- Verification audit log
-- ---------------------------------------------------------------------------
create table if not exists public.verification_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  subject_user_id uuid references auth.users (id) on delete set null,
  horse_listing_id uuid references public.horse_listings (id) on delete set null,
  document_id uuid references public.verification_documents (id) on delete set null,
  subject_type text not null check (subject_type in ('seller', 'horse', 'document')),
  action text not null,
  previous_status text,
  new_status text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists verification_audit_log_created_idx
  on public.verification_audit_log (created_at desc);

create index if not exists verification_audit_log_subject_user_idx
  on public.verification_audit_log (subject_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Sync triggers
-- ---------------------------------------------------------------------------
create or replace function public.sync_horse_listing_verification_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.verified := (new.horse_verification_status = 'verified');
  return new;
end;
$$;

drop trigger if exists horse_listings_verification_sync on public.horse_listings;
create trigger horse_listings_verification_sync
before insert or update of horse_verification_status on public.horse_listings
for each row
execute function public.sync_horse_listing_verification_flags();

create or replace function public.sync_profile_seller_verification_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.seller_verified := (new.seller_verification_status = 'verified');

  if new.seller_verification_status = 'verified' and old.seller_verification_status is distinct from 'verified' then
    new.seller_verified_at := coalesce(new.seller_verified_at, now());
  end if;

  if new.seller_verification_status <> 'verified' then
    new.seller_verified_at := null;
    new.seller_verified_by := null;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_seller_verification_sync on public.profiles;
create trigger profiles_seller_verification_sync
before insert or update of seller_verification_status on public.profiles
for each row
execute function public.sync_profile_seller_verification_flags();

create or replace function public.sync_listings_owner_seller_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.horse_listings
  set owner_seller_verified = new.seller_verified
  where user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists profiles_owner_seller_verified_sync on public.profiles;
create trigger profiles_owner_seller_verified_sync
after insert or update of seller_verified on public.profiles
for each row
execute function public.sync_listings_owner_seller_verified();

-- ---------------------------------------------------------------------------
-- RLS: verification_documents
-- ---------------------------------------------------------------------------
alter table public.verification_documents enable row level security;

drop policy if exists "Owners read own verification documents" on public.verification_documents;
create policy "Owners read own verification documents"
on public.verification_documents
for select
to authenticated
using (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists "Owners insert own verification documents" on public.verification_documents;
create policy "Owners insert own verification documents"
on public.verification_documents
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and (
    subject_type = 'seller'
    or exists (
      select 1
      from public.horse_listings hl
      where hl.id = horse_listing_id
        and hl.user_id = auth.uid()
    )
  )
);

drop policy if exists "Owners update own pending verification documents" on public.verification_documents;
create policy "Owners update own pending verification documents"
on public.verification_documents
for update
to authenticated
using (
  owner_user_id = auth.uid()
  and status = 'pending'
)
with check (
  owner_user_id = auth.uid()
  and status = 'pending'
);

drop policy if exists "Admins manage verification documents" on public.verification_documents;
create policy "Admins manage verification documents"
on public.verification_documents
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.verification_documents to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: verification_audit_log
-- ---------------------------------------------------------------------------
alter table public.verification_audit_log enable row level security;

drop policy if exists "Admins read verification audit log" on public.verification_audit_log;
create policy "Admins read verification audit log"
on public.verification_audit_log
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins insert verification audit log" on public.verification_audit_log;
create policy "Admins insert verification audit log"
on public.verification_audit_log
for insert
to authenticated
with check (public.is_admin());

grant select, insert on public.verification_audit_log to authenticated;

-- ---------------------------------------------------------------------------
-- Private verification-documents storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-documents',
  'verification-documents',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners read own verification files" on storage.objects;
create policy "Owners read own verification files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'verification-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

drop policy if exists "Owners upload own verification files" on storage.objects;
create policy "Owners upload own verification files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners update own verification files" on storage.objects;
create policy "Owners update own verification files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners delete own verification files" on storage.objects;
create policy "Owners delete own verification files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins read verification files" on storage.objects;
create policy "Admins read verification files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'verification-documents'
  and public.is_admin()
);
