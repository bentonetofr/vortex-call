import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { createSocket, type Socket } from "dgram";
import { MediaStreamTrack, RtpPacket } from "werift";
import { config } from "./config.js";
import { classifyAudioInput } from "./audioInput.js";

// Matches what the RTCPeerConnection in voiceConnection.ts declares as its
// Opus payload type — ffmpeg's own RTP muxer picks its own number, so
// every outgoing packet gets stamped with this one instead (same trick
// werift's own sendonly/ffmpeg.ts example uses).
export const OPUS_PAYLOAD_TYPE = 111;

// Decodes whatever ffmpeg is given into Opus and streams it into a werift
// MediaStreamTrack via a local UDP loopback: ffmpeg -f rtp writes RTP
// packets to 127.0.0.1:<port>, we read them back and hand them to
// track.writeRtp(). ffmpeg does all the real audio work (decoding,
// resampling, Opus encoding, real-time pacing via -re) — this class is
// just plumbing.
export class AudioSource {
  readonly track = new MediaStreamTrack({ kind: "audio" });
  private active: {
    ffmpeg: ChildProcessWithoutNullStreams;
    extractor: ChildProcessWithoutNullStreams | null;
    stopped: boolean;
  } | null = null;
  private udp: Socket = createSocket("udp4");
  private port: number | null = null;
  private ready: Promise<void>;

  constructor() {
    this.udp.on("message", (data) => {
      try {
        const rtp = RtpPacket.deSerialize(data);
        rtp.header.payloadType = OPUS_PAYLOAD_TYPE;
        this.track.writeRtp(rtp);
      } catch {
        // Malformed/partial packet — drop it rather than crash playback.
      }
    });
    this.ready = new Promise((resolve) => {
      this.udp.bind(0, "127.0.0.1", () => {
        const address = this.udp.address();
        this.port = typeof address === "object" ? address.port : null;
        resolve();
      });
    });
  }

  // Resolves when the track finishes playing `source` (naturally, or via
  // stop()). Rejects if ffmpeg couldn't even start decoding it.
  async play(source: string): Promise<void> {
    this.stop();
    await this.ready;

    const input = classifyAudioInput(source);

    return new Promise((resolve, reject) => {
      const extractor =
        input.kind === "youtube"
          ? spawn(config.ytDlpPath, [
              "--js-runtimes",
              "node",
              "--no-playlist",
              "--no-progress",
              "--no-warnings",
              "--format",
              "bestaudio[acodec=opus]/bestaudio/best",
              ...(config.ytDlpCookiesPath ? ["--cookies", config.ytDlpCookiesPath] : []),
              "--output",
              "-",
              "--",
              input.url,
            ])
          : null;
      const ffmpeg = spawn(config.ffmpegPath, [
        "-re",
        "-i",
        input.kind === "youtube" ? "pipe:0" : input.url,
        "-vn",
        "-acodec",
        "libopus",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-b:a",
        "128k",
        "-f",
        "rtp",
        `rtp://127.0.0.1:${this.port}`,
      ]);
      const playback = { ffmpeg, extractor, stopped: false };
      this.active = playback;

      if (extractor) extractor.stdout.pipe(ffmpeg.stdin);

      let ffmpegStderr = "";
      let extractorStderr = "";
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        extractor?.stdout.unpipe(ffmpeg.stdin);
        if (this.active === playback) this.active = null;
        if (error) reject(error);
        else resolve();
      };

      ffmpeg.stderr.on("data", (chunk: Buffer) => {
        ffmpegStderr = (ffmpegStderr + chunk.toString()).slice(-2000);
      });
      extractor?.stderr.on("data", (chunk: Buffer) => {
        extractorStderr = (extractorStderr + chunk.toString()).slice(-2000);
      });
      ffmpeg.stdin.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code !== "EPIPE" && !playback.stopped) {
          finish(new Error(`falha ao enviar o audio ao FFmpeg: ${err.message}`));
        }
      });

      ffmpeg.on("exit", (code, signal) => {
        if (extractor?.exitCode === null) extractor.kill("SIGTERM");
        if (playback.stopped || signal === "SIGTERM" || signal === "SIGKILL") {
          finish();
        } else if (code === 0) {
          finish();
        } else {
          const details = extractorStderr || ffmpegStderr;
          finish(new Error(`falha ao decodificar o audio (codigo ${code}): ${details.slice(-300)}`));
        }
      });

      ffmpeg.on("error", (err) => {
        extractor?.kill("SIGTERM");
        finish(new Error(`nao foi possivel iniciar o FFmpeg: ${err.message}`));
      });

      extractor?.on("error", (err) => {
        ffmpeg.kill("SIGTERM");
        finish(new Error(`nao foi possivel iniciar o yt-dlp: ${err.message}`));
      });
      extractor?.on("exit", (code, signal) => {
        if (playback.stopped || signal === "SIGTERM" || signal === "SIGKILL" || code === 0) return;
        ffmpeg.kill("SIGTERM");
        finish(new Error(`o YouTube recusou ou nao encontrou o video: ${extractorStderr.slice(-300)}`));
      });
    });
  }

  stop(): void {
    if (!this.active) return;
    const playback = this.active;
    playback.stopped = true;
    playback.extractor?.kill("SIGTERM");
    playback.ffmpeg.kill("SIGTERM");
    this.active = null;
  }
}
