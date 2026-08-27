-- Extensions
create extension if not exists pgcrypto;

-- Single-row table holding the hashed group invite code.
-- Never exposed to clients directly (no RLS policy grants access to it) —
-- only the SECURITY DEFINER join_with_invite() function below can read it.
create table app_config (
  id boolean primary key default true,
  invite_code_hash text not null,
  constraint app_config_single_row check (id)
);

-- One row per person who has joined with a valid invite code.
-- id is the Supabase Auth user id (anonymous sign-in), so RLS can key off auth.uid().
create table members (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table channels (
  id text primary key,
  name text not null,
  type text not null check (type in ('text', 'voice')),
  position int not null default 0
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null references channels (id) on delete cascade,
  author_id uuid not null references members (id) on delete cascade,
  content text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index messages_channel_id_created_at_idx on messages (channel_id, created_at);

-- Seed the channels for the group's single shared space.
insert into channels (id, name, type, position) values
  ('geral', 'geral', 'text', 0),
  ('jogos', 'jogos', 'text', 1),
  ('memes', 'memes', 'text', 2),
  ('sala-1', 'Sala 1', 'voice', 0),
  ('sala-2', 'Sala 2', 'voice', 1);

-- Placeholder invite code — replace before going live:
--   update app_config set invite_code_hash = crypt('your-real-code', gen_salt('bf'));
insert into app_config (id, invite_code_hash) values (true, crypt('changeme', gen_salt('bf')));

-- Row Level Security
alter table app_config enable row level security;
alter table members enable row level security;
alter table channels enable row level security;
alter table messages enable row level security;

-- Helper: is the current session a joined member? SECURITY DEFINER so it can
-- read `members` even from policies defined on `members` itself (avoids recursive RLS).
create or replace function is_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from members where id = auth.uid());
$$;

create policy "joined users can view members" on members
  for select using (is_member());

create policy "joined users can view channels" on channels
  for select using (is_member());

create policy "joined users can view messages" on messages
  for select using (is_member());

create policy "joined users can send messages as themselves" on messages
  for insert with check (is_member() and author_id = auth.uid());

-- Invite-code gate: creates/updates the caller's own member row after checking
-- the code server-side. The hash never leaves the database.
create or replace function join_with_invite(invite_code text, display_name text, avatar_color text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in (anonymous sign-in) before joining';
  end if;

  if not exists (
    select 1 from app_config where invite_code_hash = crypt(invite_code, invite_code_hash)
  ) then
    raise exception 'invalid invite code';
  end if;

  insert into members (id, name, color)
  values (auth.uid(), display_name, avatar_color)
  on conflict (id) do update set name = excluded.name, color = excluded.color;
end;
$$;

grant execute on function join_with_invite(text, text, text) to anon, authenticated;
