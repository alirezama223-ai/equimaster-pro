-- Restore least-privilege API grants and allow the existing admin RBAC layer
-- to read/moderate pending service-provider submissions.

revoke all on table public.equestrian_service_providers from anon;
revoke all on table public.equestrian_service_providers from authenticated;

grant select on table public.equestrian_service_providers to anon;
grant select, insert, update, delete on table public.equestrian_service_providers to authenticated;

drop policy if exists "Admins can read all equestrian service providers" on public.equestrian_service_providers;
create policy "Admins can read all equestrian service providers"
on public.equestrian_service_providers
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can moderate equestrian service providers" on public.equestrian_service_providers;
create policy "Admins can moderate equestrian service providers"
on public.equestrian_service_providers
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
