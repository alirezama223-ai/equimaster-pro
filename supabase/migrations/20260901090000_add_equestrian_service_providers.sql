create table if not exists public.equestrian_service_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 160),
  category text not null check (category in ('riding_school','trainer','horse_training','livery','veterinary','farrier','physiotherapy','transport','shop','competition_coaching','other')),
  description text check (description is null or char_length(description) <= 3000),
  country text not null,
  city text not null,
  postal_code text,
  address text,
  latitude double precision,
  longitude double precision,
  phone text,
  email text,
  website text,
  languages text[] not null default '{}',
  disciplines text[] not null default '{}',
  price_from numeric check (price_from is null or price_from >= 0),
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending','active','paused','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equestrian_service_provider_coords_check check ((latitude is null and longitude is null) or (latitude between -90 and 90 and longitude between -180 and 180))
);

create index if not exists equestrian_service_providers_category_status_idx on public.equestrian_service_providers(category, status);
create index if not exists equestrian_service_providers_location_idx on public.equestrian_service_providers(country, city);
create index if not exists equestrian_service_providers_coords_idx on public.equestrian_service_providers(latitude, longitude);

alter table public.equestrian_service_providers enable row level security;

create policy "public can view active equestrian service providers" on public.equestrian_service_providers
  for select using (status = 'active');

create policy "users can create own equestrian service provider" on public.equestrian_service_providers
  for insert with check (auth.uid() = user_id);

create policy "users can update own equestrian service provider" on public.equestrian_service_providers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can delete own equestrian service provider" on public.equestrian_service_providers
  for delete using (auth.uid() = user_id);

create or replace function public.set_equestrian_service_providers_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists equestrian_service_providers_updated_at on public.equestrian_service_providers;
create trigger equestrian_service_providers_updated_at before update on public.equestrian_service_providers
for each row execute function public.set_equestrian_service_providers_updated_at();
