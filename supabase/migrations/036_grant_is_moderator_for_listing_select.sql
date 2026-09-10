-- Fix: authenticated users need EXECUTE on is_moderator() because the
-- horse_listings SELECT policy evaluates is_moderator() when INSERT ... RETURNING
-- is used by the application. The function is SECURITY DEFINER and only returns
-- whether the current authenticated user has moderator/admin role.
grant execute on function public.is_moderator() to authenticated;
