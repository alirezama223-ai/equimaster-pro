-- EquiMaster Pro: real-time buyer/seller conversations per listing

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users (id) on delete cascade,
  seller_id uuid not null references auth.users (id) on delete cascade,
  horse_listing_id uuid not null references public.horse_listings (id) on delete cascade,
  buyer_display_name text not null default '',
  seller_display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_buyer_seller_distinct check (buyer_id <> seller_id),
  constraint conversations_unique_participants unique (buyer_id, seller_id, horse_listing_id)
);

create index if not exists conversations_buyer_id_updated_at_idx
  on public.conversations (buyer_id, updated_at desc);
create index if not exists conversations_seller_id_updated_at_idx
  on public.conversations (seller_id, updated_at desc);
create index if not exists conversations_horse_listing_id_idx
  on public.conversations (horse_listing_id);
create index if not exists conversations_updated_at_idx
  on public.conversations (updated_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at asc);
create index if not exists messages_conversation_id_unread_idx
  on public.messages (conversation_id)
  where read_at is null;
create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

create or replace function public.set_conversations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
before update on public.conversations
for each row
execute function public.set_conversations_updated_at();

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row
execute function public.touch_conversation_on_message();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Buyers can read own conversations" on public.conversations;
create policy "Buyers can read own conversations"
on public.conversations
for select
to authenticated
using (buyer_id = auth.uid());

drop policy if exists "Sellers can read listing conversations" on public.conversations;
create policy "Sellers can read listing conversations"
on public.conversations
for select
to authenticated
using (
  seller_id = auth.uid()
  and exists (
    select 1
    from public.horse_listings hl
    where hl.id = horse_listing_id
      and hl.user_id = auth.uid()
  )
);

drop policy if exists "Buyers can create conversations" on public.conversations;
create policy "Buyers can create conversations"
on public.conversations
for insert
to authenticated
with check (
  buyer_id = auth.uid()
  and buyer_id <> seller_id
  and exists (
    select 1
    from public.horse_listings hl
    where hl.id = horse_listing_id
      and hl.user_id = seller_id
      and hl.status = 'active'
  )
);

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

drop policy if exists "Recipients can mark messages read" on public.messages;
create policy "Recipients can mark messages read"
on public.messages
for update
to authenticated
using (
  sender_id <> auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
)
with check (
  sender_id <> auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

grant select, insert on public.conversations to authenticated;
grant select, insert, update on public.messages to authenticated;

-- Realtime delivery for live chat
alter publication supabase_realtime add table public.messages;

-- Migrate legacy inquiries into conversations (one per buyer/listing)
insert into public.conversations (
  buyer_id,
  seller_id,
  horse_listing_id,
  buyer_display_name,
  seller_display_name,
  created_at,
  updated_at
)
select distinct on (i.buyer_id, i.seller_id, i.horse_listing_id)
  i.buyer_id,
  i.seller_id,
  i.horse_listing_id,
  i.buyer_name,
  coalesce(hl.seller_name, 'Seller'),
  i.created_at,
  i.updated_at
from public.inquiries i
join public.horse_listings hl on hl.id = i.horse_listing_id
where i.buyer_id is not null
order by i.buyer_id, i.seller_id, i.horse_listing_id, i.created_at asc
on conflict (buyer_id, seller_id, horse_listing_id) do nothing;

insert into public.messages (conversation_id, sender_id, body, created_at, read_at)
select
  c.id,
  i.buyer_id,
  i.message,
  i.created_at,
  case
    when i.status in ('read', 'replied', 'archived') then i.updated_at
    else null
  end
from public.inquiries i
join public.conversations c
  on c.buyer_id = i.buyer_id
 and c.seller_id = i.seller_id
 and c.horse_listing_id = i.horse_listing_id
where i.buyer_id is not null
  and not exists (
    select 1
    from public.messages m
    where m.conversation_id = c.id
      and m.created_at = i.created_at
      and m.body = i.message
  );

insert into public.messages (conversation_id, sender_id, body, created_at, read_at)
select
  c.id,
  im.sender_id,
  im.message,
  im.created_at,
  case
    when i.status in ('read', 'replied', 'archived') and im.sender_id = i.buyer_id then im.created_at
    when i.status = 'replied' and im.sender_id = i.seller_id then im.created_at
    else null
  end
from public.inquiry_messages im
join public.inquiries i on i.id = im.inquiry_id
join public.conversations c
  on c.buyer_id = i.buyer_id
 and c.seller_id = i.seller_id
 and c.horse_listing_id = i.horse_listing_id
where i.buyer_id is not null
  and not exists (
    select 1
    from public.messages m
    where m.conversation_id = c.id
      and m.sender_id = im.sender_id
      and m.created_at = im.created_at
      and m.body = im.message
  );
