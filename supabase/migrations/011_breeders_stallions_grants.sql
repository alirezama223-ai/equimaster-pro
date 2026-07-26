-- Fix: breeders / stallions table privileges for Supabase API roles
-- Run this manually in Supabase Dashboard → SQL Editor if inserts fail with
-- "permission denied for table breeders" or "permission denied for table stallions"
-- (SQLSTATE 42501).
--
-- RLS policies from 009 are not enough — anon/authenticated roles also need GRANTs.

grant select on public.breeders to anon;
grant select, insert, update, delete on public.breeders to authenticated;

grant select on public.stallions to anon;
grant select, insert, update, delete on public.stallions to authenticated;
