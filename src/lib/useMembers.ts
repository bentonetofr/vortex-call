"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import { usePresence } from "./usePresence";
import { memberFromRow, type Member, type MemberRow } from "./types";

export function useMembers(currentMember: Member | null): Member[] {
  const [roster, setRoster] = useState<MemberRow[]>([]);
  const onlineIds = usePresence(currentMember);

  useEffect(() => {
    getSupabase()
      .from("members")
      .select("id, name, nickname, color, avatar_url, onboarded")
      .then(({ data }) => {
        if (data) setRoster(data);
      });
  }, [currentMember]);

  return roster.map((m) => ({
    ...memberFromRow(m),
    online: onlineIds.has(m.id),
    voiceChannelId: null,
  }));
}
