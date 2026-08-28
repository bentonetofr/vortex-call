"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import type { Member } from "./types";

export interface VoiceRosterEntry {
  userId: string;
  name: string;
  color: string;
  avatarUrl: string | null;
}

interface RosterPresence extends VoiceRosterEntry {
  channelId: string | null;
}

// Tracks who's in which voice channel, globally, so the sidebar can show a
// preview of a room's occupants before the user has joined it themselves.
//
// This intentionally does NOT subscribe to the per-channel `voice:${id}`
// topics that useVoiceCall uses for WebRTC signaling — a single global
// "voice-roster" presence topic, subscribed once, is used instead. An
// earlier version of this feature subscribed to those same per-channel
// topics from a second hook, which caused a duplicate subscription (from
// the same client, to the same topic) to silently hang once the user
// actually joined a call. Keeping this on its own topic avoids that.
export function useVoiceRoster(
  member: Member | null,
  activeChannelId: string | null,
): Record<string, VoiceRosterEntry[]> {
  const [byChannel, setByChannel] = useState<Record<string, VoiceRosterEntry[]>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const activeChannelIdRef = useRef(activeChannelId);

  useEffect(() => {
    activeChannelIdRef.current = activeChannelId;
  }, [activeChannelId]);

  useEffect(() => {
    if (!member) return;
    const supabase = getSupabase();
    const channel = supabase.channel("voice-roster", {
      config: { presence: { key: member.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<RosterPresence>();
        const grouped: Record<string, VoiceRosterEntry[]> = {};
        for (const entries of Object.values(state)) {
          const entry = entries[0];
          if (!entry.channelId) continue;
          (grouped[entry.channelId] ??= []).push({
            userId: entry.userId,
            name: entry.name,
            color: entry.color,
            avatarUrl: entry.avatarUrl,
          });
        }
        setByChannel(grouped);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        channelRef.current = channel;
        await channel.track({
          userId: member.id,
          name: member.name,
          color: member.color,
          avatarUrl: member.avatarUrl,
          channelId: activeChannelIdRef.current,
        } satisfies RosterPresence);
      });

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [member]);

  useEffect(() => {
    if (!member || !channelRef.current) return;
    channelRef.current.track({
      userId: member.id,
      name: member.name,
      color: member.color,
      avatarUrl: member.avatarUrl,
      channelId: activeChannelId,
    } satisfies RosterPresence);
  }, [activeChannelId, member]);

  return byChannel;
}
