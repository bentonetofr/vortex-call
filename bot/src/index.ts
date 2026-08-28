import "dotenv/config";
import { signInBot } from "./supabaseClient.js";
import { AudioSource } from "./audioSource.js";
import { VoiceConnection } from "./voiceConnection.js";
import { Player } from "./player.js";
import { RosterWatcher } from "./roster.js";
import { startCommandListener } from "./commands.js";
import { verifyRuntimeDependencies } from "./runtimeDependencies.js";

async function main() {
  await verifyRuntimeDependencies();
  const bot = await signInBot();
  console.log(`DJ Vortex online as "${bot.name}" (${bot.id})`);

  const audio = new AudioSource();
  const voice = new VoiceConnection(bot, audio.track);
  const player = new Player(bot.id, audio, voice);

  const roster = new RosterWatcher();
  roster.start();

  startCommandListener(bot, player, roster);

  console.log("Listening for m!play / m!skip / m!stop / m!fila in chat...");
}

main().catch((err) => {
  console.error("Fatal error starting DJ Vortex:", err);
  process.exit(1);
});

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
