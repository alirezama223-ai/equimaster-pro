-- Fix: stallion owners could INSERT a row but UPDATE ... RETURNING failed with
-- PGRST116 ("The result contains 0 rows") when saving image_urls / cover_image_url.
--
-- Root cause: the UPDATE policy WITH CHECK re-ran an EXISTS subquery against
-- public.breeders. That subquery is subject to breeders RLS and can fail during
-- UPDATE evaluation even though the same breeder_id passed INSERT WITH CHECK,
-- so PostgreSQL updates 0 rows and PostgREST cannot coerce .single().
--
-- Fix: keep breeder ownership enforced on INSERT, prevent breeder_id / owner_id
-- changes via trigger, and use the same owner-only UPDATE policy pattern that
-- already works for breeders and horse_listings.
--
-- Run this manually in Supabase Dashboard → SQL Editor.

create or replace function public.enforce_stallion_immutable_refs()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.owner_id is distinct from old.owner_id then
      raise exception 'stallion owner_id cannot be changed';
    end if;

    if new.breeder_id is distinct from old.breeder_id then
      raise exception 'stallion breeder_id cannot be changed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists stallions_immutable_refs on public.stallions;
create trigger stallions_immutable_refs
before update on public.stallions
for each row
execute function public.enforce_stallion_immutable_refs();

drop policy if exists "Owners can update own stallions" on public.stallions;
create policy "Owners can update own stallions"
on public.stallions
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Re-assert owner SELECT so INSERT/UPDATE ... RETURNING always works for owners.
drop policy if exists "Owners can read own stallions" on public.stallions;
create policy "Owners can read own stallions"
on public.stallions
for select
to authenticated
using (owner_id = auth.uid());

grant select, insert, update, delete on public.stallions to authenticated;
