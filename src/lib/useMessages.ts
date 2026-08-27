"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { messageFromRow, type Message, type MessageRow } from "./types";

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    let cancelled = false;

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
          setMessages((prev) => [...prev, messageFromRow(payload.new as MessageRow)]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  return messages;
}

export async function sendMessage(channelId: string, authorId: string, content: string) {
  await supabase.from("messages").insert({ channel_id: channelId, author_id: authorId, content });
}
