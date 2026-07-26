-- EquiMaster Pro: inquiry conversation messages
-- Run this manually in Supabase Dashboard → SQL Editor

create table if not exists public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  message text not null check (char_length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists inquiry_messages_inquiry_id_idx on public.inquiry_messages (inquiry_id);
create index if not exists inquiry_messages_sender_id_idx on public.inquiry_messages (sender_id);
create index if not exists inquiry_messages_created_at_idx on public.inquiry_messages (created_at);
create index if not exists inquiry_messages_inquiry_id_created_at_idx
  on public.inquiry_messages (inquiry_id, created_at asc);

alter table public.inquiry_messages enable row level security;

drop policy if exists "Participants can read inquiry messages" on public.inquiry_messages;
create policy "Participants can read inquiry messages"
on public.inquiry_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.inquiries i
    where i.id = inquiry_id
      and (i.seller_id = auth.uid() or i.buyer_id = auth.uid())
  )
);

drop policy if exists "Participants can send inquiry messages" on public.inquiry_messages;
create policy "Participants can send inquiry messages"
on public.inquiry_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.inquiries i
    where i.id = inquiry_id
      and (i.seller_id = auth.uid() or i.buyer_id = auth.uid())
      and i.status <> 'archived'
  )
);

grant select, insert on public.inquiry_messages to authenticated;

-- Keep inquiry status in sync when conversation messages are sent.
create or replace function public.sync_inquiry_status_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent public.inquiries%rowtype;
begin
  select * into parent from public.inquiries where id = new.inquiry_id;

  if not found then
    return new;
  end if;

  if parent.seller_id = new.sender_id then
    update public.inquiries
    set status = 'replied', updated_at = now()
    where id = new.inquiry_id;
  elsif parent.buyer_id = new.sender_id then
    update public.inquiries
    set status = 'new', updated_at = now()
    where id = new.inquiry_id;
  end if;

  return new;
end;
$$;

drop trigger if exists inquiry_messages_sync_status on public.inquiry_messages;

create trigger inquiry_messages_sync_status
after insert on public.inquiry_messages
for each row
execute function public.sync_inquiry_status_on_message();
