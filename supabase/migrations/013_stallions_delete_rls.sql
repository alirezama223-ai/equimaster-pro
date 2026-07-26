-- Fix: stallion DELETE silently affected 0 rows, so the UI hid the stallion
-- optimistically but the row remained and reappeared after refresh.
--
-- PostgREST returns success with no error when RLS blocks DELETE (0 rows deleted).
-- The app now verifies deleted row count; this migration restores the owner
-- DELETE policy and DELETE grant required for authenticated owners.
--
-- Run this manually in Supabase Dashboard → SQL Editor.

drop policy if exists "Owners can delete own stallions" on public.stallions;
create policy "Owners can delete own stallions"
on public.stallions
for delete
to authenticated
using (owner_id = auth.uid());

grant delete on public.stallions to authenticated;
