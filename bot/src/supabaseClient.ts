import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: true },
});

export interface BotIdentity {
  id: string;
  name: string;
  color: string;
  avatarUrl: string | null;
}

// Signs the bot in as its own real member account (created ahead of time
// in the Supabase dashboard) so it's subject to the same RLS policies as
// any human — no service-role key needed or wanted here.
export async function signInBot(): Promise<BotIdentity> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: config.botEmail,
    password: config.botPassword,
  });
  if (error || !data.user) {
    throw new Error(`Bot sign-in failed: ${error?.message ?? "no user returned"}`);
  }

  const { data: row, error: rowError } = await supabase
    .from("members")
    .select("id, name, color, avatar_url")
    .eq("id", data.user.id)
    .single();
  if (rowError || !row) {
    throw new Error(`Bot has no members row — did the signup trigger run? (${rowError?.message})`);
  }

  return { id: row.id, name: row.name, color: row.color, avatarUrl: row.avatar_url };
}
