import { supabase } from "./supabaseClient.js";

interface RosterPresence {
  userId: string;
  channelId: string | null;
}

// Passively watches the same global "voice-roster" presence topic the
// sidebar preview uses (see src/lib/useVoiceRoster.ts) to know which voice
// channel a given user is currently in — so `!play` knows where to join
// without needing its own argument for it. The bot never tracks its own
// presence here, so it never shows up in anyone's sidebar preview.
export class RosterWatcher {
  private byUser = new Map<string, string | null>();

  start(): void {
    const channel = supabase.channel("voice-roster", {
      config: { presence: { key: "dj-vortex-observer" } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<RosterPresence>();
        this.byUser.clear();
        for (const entries of Object.values(state)) {
          const entry = entries[0];
          this.byUser.set(entry.userId, entry.channelId);
        }
      })
      .subscribe();
  }

  channelOf(userId: string): string | null {
    return this.byUser.get(userId) ?? null;
  }
}
