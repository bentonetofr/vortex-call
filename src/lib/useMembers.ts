"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import { usePresence } from "./usePresence";
import type { Member } from "./types";

type Roster = Pick<Member, "id" | "name" | "color">;

export function useMembers(currentMember: Member | null): Member[] {
  const [roster, setRoster] = useState<Roster[]>([]);
  const onlineIds = usePresence(currentMember);

  useEffect(() => {
    getSupabase()
      .from("members")
      .select("id, name, color")
      .then(({ data }) => {
        if (data) setRoster(data);
      });
  }, [currentMember]);

  return roster.map((m) => ({
    ...m,
    online: onlineIds.has(m.id),
    voiceChannelId: null,
  }));
}
