-- Secure private horse documents and constrain the private document bucket.

alter table public.personal_horse_documents enable row level security;

drop policy if exists "personal_horse_documents_select" on public.personal_horse_documents;
create policy "personal_horse_documents_select"
on public.personal_horse_documents
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "personal_horse_documents_insert" on public.personal_horse_documents;
create policy "personal_horse_documents_insert"
on public.personal_horse_documents
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.personal_horses ph
    where ph.id = personal_horse_id and ph.owner_id = auth.uid()
  )
);

drop policy if exists "personal_horse_documents_update" on public.personal_horse_documents;
create policy "personal_horse_documents_update"
on public.personal_horse_documents
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "personal_horse_documents_delete" on public.personal_horse_documents;
create policy "personal_horse_documents_delete"
on public.personal_horse_documents
for delete
to authenticated
using (owner_id = auth.uid());

update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
where id = 'personal-horse-documents';

drop policy if exists "personal_horse_documents_storage_update" on storage.objects;
create policy "personal_horse_documents_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'personal-horse-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'personal-horse-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
