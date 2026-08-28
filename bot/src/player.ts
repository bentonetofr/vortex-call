import type { AudioSource } from "./audioSource.js";
import type { VoiceConnection } from "./voiceConnection.js";
import { postMessage } from "./chat.js";

export class Player {
  private queue: string[] = [];
  private playing = false;
  private voiceChannelId: string | null = null;

  constructor(
    private botId: string,
    private audio: AudioSource,
    private voice: VoiceConnection,
  ) {}

  async enqueue(voiceChannelId: string, replyChannelId: string, url: string): Promise<void> {
    if (this.voiceChannelId && this.voiceChannelId !== voiceChannelId) {
      await this.reply(replyChannelId, "Já estou tocando em outra sala de voz. Manda `!stop` lá primeiro.");
      return;
    }
    this.voiceChannelId = voiceChannelId;
    this.queue.push(url);
    await this.reply(
      replyChannelId,
      this.playing ? `Adicionado à fila (posição ${this.queue.length}).` : "🎵 Tocando agora.",
    );
    if (!this.playing) void this.runQueue(replyChannelId);
  }

  private async runQueue(replyChannelId: string): Promise<void> {
    if (!this.voiceChannelId) return;
    this.playing = true;
    await this.voice.join(this.voiceChannelId);

    while (this.queue.length > 0) {
      const next = this.queue.shift()!;
      try {
        await this.audio.play(next);
      } catch (err) {
        await this.reply(
          replyChannelId,
          `Não consegui tocar esse link. (${(err as Error).message.slice(0, 200)})`,
        );
      }
    }

    this.playing = false;
    this.voice.leave();
    this.voiceChannelId = null;
    await this.reply(replyChannelId, "Fila vazia — saindo da sala.");
  }

  skip(): void {
    if (this.playing) this.audio.stop();
  }

  stop(): void {
    this.queue = [];
    this.audio.stop();
  }

  status(): string {
    if (!this.playing) return "Não estou tocando nada agora.";
    return `Tocando agora. ${this.queue.length} na fila.`;
  }

  private reply(channelId: string, text: string): Promise<void> {
    return postMessage(this.botId, channelId, text);
  }
}
