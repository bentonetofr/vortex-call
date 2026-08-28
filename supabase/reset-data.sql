-- Wipes ALL user-placed data: chat messages and membership rows (name,
-- nick, avatar, color). Channels (geral/jogos/memes/sala-1/sala-2) are
-- structural, not user data, so they're left alone.
--
-- This does NOT clear the `avatars` storage bucket — Supabase blocks direct
-- SQL deletes on storage.objects ("Use the Storage API instead"). It
-- doesn't matter functionally: every member row below is recreated with
-- avatar_url unset, so the app falls back to the colored-initial avatar for
-- everyone regardless of what old files are still sitting in the bucket.
-- To actually reclaim that storage space, clear it manually: Supabase
-- Dashboard → Storage → avatars → select all → Delete.
--
-- Existing Supabase Auth accounts are NOT touched — everyone's login keeps
-- working. Each account gets a fresh member row re-provisioned right after
-- the wipe (same logic as the handle_new_user() trigger), so nobody gets
-- locked out on "no-member". Since onboarded defaults to false, everyone
-- sees the profile setup panel again next time they open the app.
--
-- Irreversible. Run in the Supabase SQL editor only when you actually mean
-- to reset the group's data.

begin;

delete from messages;
delete from members;

insert into members (id, name, color)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
  (array['#f2c94c', '#7b6fc9', '#c9a06f', '#5fb3a3', '#e0708c', '#6fa8dc'])[1 + floor(random() * 6)::int]
from auth.users u;

commit;
