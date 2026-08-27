"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Member } from "./types";

export function usePresence(member: Member | null) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!member) return;

    const channel = supabase.channel("presence:lobby", {
      config: { presence: { key: member.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [member]);

  return onlineIds;
}
