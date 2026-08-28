import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { createSocket, type Socket } from "dgram";
import { MediaStreamTrack, RtpPacket } from "werift";
import { config } from "./config.js";

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
  private ffmpeg: ChildProcessWithoutNullStreams | null = null;
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

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(config.ffmpegPath, [
        "-re",
        "-i",
        source,
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
      this.ffmpeg = ffmpeg;

      let stderrTail = "";
      ffmpeg.stderr.on("data", (chunk: Buffer) => {
        stderrTail = (stderrTail + chunk.toString()).slice(-2000);
      });

      ffmpeg.on("exit", (code, signal) => {
        this.ffmpeg = null;
        if (signal === "SIGTERM" || signal === "SIGKILL") {
          resolve(); // stopped intentionally (skip/stop/next track)
        } else if (code === 0) {
          resolve(); // finished playing normally
        } else {
          reject(new Error(`ffmpeg exited with code ${code}: ${stderrTail.slice(-300)}`));
        }
      });

      ffmpeg.on("error", (err) => {
        this.ffmpeg = null;
        reject(err);
      });
    });
  }

  stop(): void {
    this.ffmpeg?.kill("SIGTERM");
    this.ffmpeg = null;
  }
}
