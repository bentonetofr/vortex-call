import type { AudioSource } from "./audioSource.js";
import type { VoiceConnection } from "./voiceConnection.js";
import { postMessage } from "./chat.js";
import { classifyAudioInput } from "./audioInput.js";

interface QueueItem {
  url: string;
  replyChannelId: string;
}

export class Player {
  private queue: QueueItem[] = [];
  private playing = false;
  private voiceChannelId: string | null = null;

  constructor(
    private botId: string,
    private audio: AudioSource,
    private voice: VoiceConnection,
  ) {}

  async enqueue(voiceChannelId: string, replyChannelId: string, url: string): Promise<void> {
    const input = classifyAudioInput(url);
    if (this.voiceChannelId && this.voiceChannelId !== voiceChannelId) {
      await this.reply(replyChannelId, "Ja estou tocando em outra sala de voz. Mande `m!stop` la primeiro.");
      return;
    }
    this.voiceChannelId = voiceChannelId;
    this.queue.push({ url: input.url, replyChannelId });
    await this.reply(
      replyChannelId,
      this.playing ? `Adicionado à fila (posição ${this.queue.length}).` : "🎵 Tocando agora.",
    );
    if (!this.playing) void this.runQueue(replyChannelId);
  }

  private async runQueue(replyChannelId: string): Promise<void> {
    if (!this.voiceChannelId) return;
    this.playing = true;
    try {
      await this.voice.join(this.voiceChannelId);
    } catch (err) {
      this.playing = false;
      this.voiceChannelId = null;
      this.queue = [];
      await this.reply(replyChannelId, `Nao consegui entrar na sala de voz. (${this.errorMessage(err)})`);
      return;
    }

    while (this.queue.length > 0) {
      const next = this.queue.shift()!;
      try {
        await this.audio.play(next.url);
      } catch (err) {
        await this.reply(
          next.replyChannelId,
          `Nao consegui tocar esse link. (${this.errorMessage(err)})`,
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

  private errorMessage(error: unknown): string {
    return (error instanceof Error ? error.message : String(error)).slice(0, 240);
  }
}
