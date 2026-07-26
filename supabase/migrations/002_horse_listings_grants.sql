-- Fix: horse_listings table privileges for Supabase API roles
-- Run this in Supabase Dashboard → SQL Editor if inserts fail with
-- "permission denied for table horse_listings" (SQLSTATE 42501).

grant select on public.horse_listings to anon;
grant select, insert, update, delete on public.horse_listings to authenticated;
