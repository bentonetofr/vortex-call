import { supabase } from "./supabaseClient.js";

export async function postMessage(authorId: string, channelId: string, content: string): Promise<void> {
  const { error } = await supabase.from("messages").insert({ channel_id: channelId, author_id: authorId, content });
  if (error) console.error("[chat] failed to post message:", error.message);
}
