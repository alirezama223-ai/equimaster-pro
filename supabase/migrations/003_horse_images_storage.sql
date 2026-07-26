-- EquiMaster Pro: horse-images Storage bucket and policies
-- Run manually in Supabase Dashboard → SQL Editor before testing uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'horse-images',
  'horse-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read horse listing images" on storage.objects;
create policy "Public read horse listing images"
on storage.objects
for select
to public
using (bucket_id = 'horse-images');

drop policy if exists "Users upload own horse listing images" on storage.objects;
create policy "Users upload own horse listing images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'horse-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own horse listing images" on storage.objects;
create policy "Users update own horse listing images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'horse-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'horse-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own horse listing images" on storage.objects;
create policy "Users delete own horse listing images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'horse-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
