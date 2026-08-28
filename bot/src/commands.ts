import { supabase, type BotIdentity } from "./supabaseClient.js";
import { postMessage } from "./chat.js";
import type { Player } from "./player.js";
import type { RosterWatcher } from "./roster.js";
import { InvalidAudioUrlError } from "./audioInput.js";

interface MessageRow {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
}

const PREFIX = "m!";

const HELP = [
  "**Comandos:**",
  "`m!play <url>` — toca um video do YouTube ou link direto de audio na sua sala de voz atual",
  "`m!skip` — pula a faixa atual",
  "`m!stop` — limpa a fila e sai da sala",
  "`m!fila` — mostra o que está tocando",
].join("\n");

export function startCommandListener(bot: BotIdentity, player: Player, roster: RosterWatcher): void {
  supabase
    .channel("dj-vortex-commands")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      async (payload: { new: MessageRow }) => {
        const row = payload.new;
        if (row.author_id === bot.id) return;
        if (!row.content.startsWith(PREFIX)) return;

        const [rawCommand, ...rest] = row.content.slice(PREFIX.length).trim().split(/\s+/);
        const command = rawCommand?.toLowerCase();
        const arg = rest.join(" ");
        const reply = (text: string) => postMessage(bot.id, row.channel_id, text);

        switch (command) {
          case "play":
          case "tocar": {
            if (!arg) {
              await reply("Envie um link do YouTube ou de audio: `m!play <url>`");
              return;
            }
            const voiceChannelId = roster.channelOf(row.author_id);
            if (!voiceChannelId) {
              await reply("Você precisa estar numa sala de voz primeiro.");
              return;
            }
            try {
              await player.enqueue(voiceChannelId, row.channel_id, arg);
            } catch (err) {
              const message =
                err instanceof InvalidAudioUrlError ? err.message : "Ocorreu um erro ao adicionar esse link.";
              await reply(message);
            }
            return;
          }
          case "skip":
          case "pular":
            player.skip();
            return;
          case "stop":
          case "parar":
            player.stop();
            await reply("Parado.");
            return;
          case "queue":
          case "fila":
            await reply(player.status());
            return;
          case "help":
          case "ajuda":
            await reply(HELP);
            return;
          default:
            return;
        }
      },
    )
    .subscribe();
}
