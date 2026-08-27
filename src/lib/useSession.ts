"use client";

import { useCallback, useEffect, useState } from "react";
import { randomAvatarColor } from "./colors";
import { supabase } from "./supabase";
import type { Member } from "./types";

export function useSession() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      let userId = sessionData.session?.user.id;

      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) {
          if (!cancelled) setLoading(false);
          return;
        }
        userId = data.user.id;
      }

      const { data: row } = await supabase
        .from("members")
        .select("id, name, color")
        .eq("id", userId)
        .maybeSingle();

      if (!cancelled) {
        setMember(row ? { ...row, online: true, voiceChannelId: null } : null);
        setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const join = useCallback(async (inviteCode: string, displayName: string) => {
    setJoinError(null);
    const color = randomAvatarColor();

    const { error } = await supabase.rpc("join_with_invite", {
      invite_code: inviteCode,
      display_name: displayName,
      avatar_color: color,
    });

    if (error) {
      setJoinError("Código de convite inválido.");
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setMember({ id: data.user.id, name: displayName, color, online: true, voiceChannelId: null });
    }
  }, []);

  return { member, loading, join, joinError };
}
