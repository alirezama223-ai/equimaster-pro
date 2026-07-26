-- Fix: buyers must be able to SELECT inquiries they created.
-- Required because createInquiry uses INSERT ... RETURNING (`.select("id").single()`).
-- Without this policy, authenticated buyers pass INSERT RLS but the returned row
-- is blocked by SELECT RLS, causing inquiry submission to fail.
-- Run this manually in Supabase Dashboard → SQL Editor.

drop policy if exists "Buyers can read own inquiries" on public.inquiries;
create policy "Buyers can read own inquiries"
on public.inquiries
for select
to authenticated
using (buyer_id = auth.uid());

-- Re-assert table grants (safe if 006 already applied).
grant select, insert, update on public.inquiries to authenticated;
