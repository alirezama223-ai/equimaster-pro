-- EquiMaster Pro: horse listing inquiries
-- Run this manually in Supabase Dashboard → SQL Editor

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  horse_listing_id uuid not null references public.horse_listings (id) on delete cascade,
  seller_id uuid not null references auth.users (id) on delete cascade,
  buyer_id uuid references auth.users (id) on delete set null,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiries_seller_id_idx on public.inquiries (seller_id);
create index if not exists inquiries_buyer_id_idx on public.inquiries (buyer_id);
create index if not exists inquiries_horse_listing_id_idx on public.inquiries (horse_listing_id);
create index if not exists inquiries_status_idx on public.inquiries (status);
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_seller_id_status_idx on public.inquiries (seller_id, status);

create or replace function public.set_inquiries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists inquiries_updated_at on public.inquiries;

create trigger inquiries_updated_at
before update on public.inquiries
for each row
execute function public.set_inquiries_updated_at();

alter table public.inquiries enable row level security;

drop policy if exists "Sellers can read own inquiries" on public.inquiries;
create policy "Sellers can read own inquiries"
on public.inquiries
for select
to authenticated
using (seller_id = auth.uid());

drop policy if exists "Buyers can create inquiries" on public.inquiries;
create policy "Buyers can create inquiries"
on public.inquiries
for insert
to authenticated
with check (
  buyer_id = auth.uid()
  and buyer_id is distinct from seller_id
  and exists (
    select 1
    from public.horse_listings hl
    where hl.id = horse_listing_id
      and hl.user_id = seller_id
      and hl.status = 'active'
  )
);

drop policy if exists "Sellers can update own inquiries" on public.inquiries;
create policy "Sellers can update own inquiries"
on public.inquiries
for update
to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid());

grant select, insert, update on public.inquiries to authenticated;
