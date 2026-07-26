-- EquiMaster Pro: stallion and breeder image storage
-- Run this manually in Supabase Dashboard → SQL Editor

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stallion-images',
  'stallion-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'breeder-images',
  'breeder-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read stallion images" on storage.objects;
create policy "Public read stallion images"
on storage.objects
for select
to public
using (bucket_id = 'stallion-images');

drop policy if exists "Users upload own stallion images" on storage.objects;
create policy "Users upload own stallion images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'stallion-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own stallion images" on storage.objects;
create policy "Users update own stallion images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'stallion-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'stallion-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own stallion images" on storage.objects;
create policy "Users delete own stallion images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'stallion-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Public read breeder images" on storage.objects;
create policy "Public read breeder images"
on storage.objects
for select
to public
using (bucket_id = 'breeder-images');

drop policy if exists "Users upload own breeder images" on storage.objects;
create policy "Users upload own breeder images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'breeder-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own breeder images" on storage.objects;
create policy "Users update own breeder images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'breeder-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'breeder-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own breeder images" on storage.objects;
create policy "Users delete own breeder images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'breeder-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
