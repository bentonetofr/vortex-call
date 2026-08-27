"use client";

import { useEffect, useState } from "react";
import { playMessageSound } from "./sounds";
import { getSupabase } from "./supabase";
import { messageFromRow, type Message, type MessageRow } from "./types";

export function useMessages(channelId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabase();

    supabase
      .from("messages")
      .select("id, channel_id, author_id, content, created_at")
      .eq("channel_id", channelId)
      .order("created_at")
      .then(({ data }) => {
        if (cancelled) return;
        setMessages(data ? (data as MessageRow[]).map(messageFromRow) : []);
      });

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => [...prev, messageFromRow(row)]);
          if (row.author_id !== currentUserId) playMessageSound();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [channelId, currentUserId]);

  return messages;
}

export async function sendMessage(channelId: string, authorId: string, content: string) {
  await getSupabase().from("messages").insert({ channel_id: channelId, author_id: authorId, content });
}
