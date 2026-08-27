"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import type { Channel } from "./types";

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    getSupabase()
      .from("channels")
      .select("id, name, type")
      .order("position")
      .then(({ data }) => {
        if (data) setChannels(data as Channel[]);
      });
  }, []);

  return channels;
}
