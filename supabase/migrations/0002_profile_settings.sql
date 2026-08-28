-- Profile settings: name is now editable, plus an optional nickname (shown
-- instead of name when set) and an optional profile picture. `onboarded`
-- drives the one-time "set up your profile" panel after first login.
alter table members
  add column if not exists nickname text,
  add column if not exists avatar_url text,
  add column if not exists onboarded boolean not null default false;

create policy "members can update themselves" on members
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Storage bucket for profile pictures. Public so avatar images can be
-- rendered with a plain <img src>, no signed URLs needed.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');

-- Files are uploaded to `{user_id}/...`, so each member can only touch
-- their own folder.
create policy "members can upload their own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "members can update their own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "members can delete their own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
