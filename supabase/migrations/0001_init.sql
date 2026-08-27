-- One row per person who has ever signed in (Google or email/password).
-- id is the Supabase Auth user id, so RLS can key off auth.uid().
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

-- Required for the app's live chat updates (Realtime Postgres Changes) —
-- new tables aren't included in this publication by default.
alter publication supabase_realtime add table messages;

-- Seed the channels for the group's single shared space.
insert into channels (id, name, type, position) values
  ('geral', 'geral', 'text', 0),
  ('jogos', 'jogos', 'text', 1),
  ('memes', 'memes', 'text', 2),
  ('sala-1', 'Sala 1', 'voice', 0),
  ('sala-2', 'Sala 2', 'voice', 1);

-- Runs after every new Supabase Auth signup (Google or email/password).
-- No allowlist: anyone who signs in becomes a member automatically.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  colors text[] := array['#f2c94c', '#7b6fc9', '#c9a06f', '#5fb3a3', '#e0708c', '#6fa8dc'];
begin
  insert into members (id, name, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    colors[1 + floor(random() * array_length(colors, 1))::int]
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security — still requires being signed in, just no more allowlist.
alter table members enable row level security;
alter table channels enable row level security;
alter table messages enable row level security;

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
