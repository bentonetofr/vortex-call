import { MediaStream, RTCPeerConnection, RTCRtpCodecParameters, type MediaStreamTrack } from "werift";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, type BotIdentity } from "./supabaseClient.js";
import { fetchIceServers } from "./iceServers.js";
import { OPUS_PAYLOAD_TYPE } from "./audioSource.js";

type MediaMode = "none" | "camera" | "screen";

interface PresencePayload {
  userId: string;
  name: string;
  color: string;
  avatarUrl: string | null;
  micEnabled: boolean;
  deafened: boolean;
  mediaMode: MediaMode;
}

interface SignalMessage {
  to: string;
  from: string;
  type: "offer" | "answer" | "ice-candidate";
  sdp?: { type: string; sdp: string };
  candidate?: unknown;
}

// Mirrors src/lib/useVoiceCall.ts's signaling protocol byte-for-byte (same
// `voice:${channelId}` topic, same PresencePayload/SignalMessage shapes,
// same Perfect Negotiation polite/impolite rule) so the bot looks like
// just another peer to every browser client — nothing on the app side
// needs to know it isn't human.
export class VoiceConnection {
  private channel: RealtimeChannel | null = null;
  private connections = new Map<string, RTCPeerConnection>();
  private polite = new Map<string, boolean>();
  private makingOffer = new Map<string, boolean>();
  private ignoreOffer = new Map<string, boolean>();
  private iceServers: Awaited<ReturnType<typeof fetchIceServers>> = [];
  private audioStream: MediaStream;

  constructor(
    private bot: BotIdentity,
    private audioTrack: MediaStreamTrack,
  ) {
    // Supplying a MediaStream makes the SDP include an msid. The browser
    // consumes event.streams[0], so a streamless transceiver is inaudible in
    // the Vortex Call UI even though RTP packets are reaching the peer.
    this.audioStream = new MediaStream([audioTrack]);
  }

  async join(channelId: string): Promise<void> {
    if (this.channel) this.leave();

    this.iceServers = await fetchIceServers();

    const channel = supabase.channel(`voice:${channelId}`, {
      config: { presence: { key: this.bot.id }, broadcast: { self: false } },
    });
    this.channel = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresencePayload>();
        const currentIds = new Set(Object.keys(state));
        for (const peerId of Array.from(this.connections.keys())) {
          if (!currentIds.has(peerId)) this.closePeer(peerId);
        }
        for (const peerId of Object.keys(state)) {
          if (peerId === this.bot.id) continue;
          this.ensureConnection(peerId);
        }
      })
      .on("broadcast", { event: "signal" }, ({ payload }) => {
        const message = payload as SignalMessage;
        if (message.to !== this.bot.id) return;
        void this.handleSignal(message.from, message).catch((err) => {
          console.error(`[voice] failed to handle ${message.type} from ${message.from}:`, err);
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: this.bot.id,
            name: this.bot.name,
            color: this.bot.color,
            avatarUrl: this.bot.avatarUrl,
            micEnabled: true,
            deafened: false,
            mediaMode: "none",
          } satisfies PresencePayload);
        }
      });
  }

  private send(message: Omit<SignalMessage, "from">): void {
    this.channel?.send({
      type: "broadcast",
      event: "signal",
      payload: { ...message, from: this.bot.id } satisfies SignalMessage,
    });
  }

  private ensureConnection(peerId: string): RTCPeerConnection {
    const existing = this.connections.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      codecs: {
        audio: [
          new RTCRtpCodecParameters({
            mimeType: "audio/opus",
            clockRate: 48000,
            channels: 2,
            payloadType: OPUS_PAYLOAD_TYPE,
          }),
        ],
      },
    });
    this.connections.set(peerId, pc);
    // Same rule as the browser: whoever has the "smaller" id defers to the
    // other (polite) on an offer collision, so both sides always agree.
    this.polite.set(peerId, this.bot.id < peerId);
    this.makingOffer.set(peerId, false);
    this.ignoreOffer.set(peerId, false);

    pc.addTransceiver(this.audioTrack, {
      direction: "sendonly",
      streams: [this.audioStream],
    });

    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== "stable") return;
        this.makingOffer.set(peerId, true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.send({ to: peerId, type: "offer", sdp: pc.localDescription! });
      } catch (err) {
        console.error(`[voice] negotiation failed with ${peerId}:`, err);
      } finally {
        this.makingOffer.set(peerId, false);
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) this.send({ to: peerId, type: "ice-candidate", candidate: candidate.toJSON() });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        this.closePeer(peerId);
      }
    };

    return pc;
  }

  private async handleSignal(from: string, message: SignalMessage): Promise<void> {
    const pc = this.ensureConnection(from);
    const polite = this.polite.get(from) ?? false;

    if (message.type === "offer" || message.type === "answer") {
      // A polite peer implicitly rolls back its local offer when accepting a
      // colliding remote offer. The answer to that abandoned offer can still
      // arrive later; werift correctly rejects it unless we discard it here.
      if (
        message.type === "answer" &&
        pc.signalingState !== "have-local-offer" &&
        pc.signalingState !== "have-remote-pranswer"
      ) {
        console.warn(`[voice] ignoring stale answer from ${from} while ${pc.signalingState}`);
        return;
      }

      const collision =
        message.type === "offer" && (this.makingOffer.get(from) || pc.signalingState !== "stable");
      const ignore = !polite && collision;
      this.ignoreOffer.set(from, ignore);
      if (ignore) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await pc.setRemoteDescription(message.sdp as any);
      if (message.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.send({ to: from, type: "answer", sdp: pc.localDescription! });
      }
    } else if (message.type === "ice-candidate" && message.candidate) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await pc.addIceCandidate(message.candidate as any);
      } catch (err) {
        if (!this.ignoreOffer.get(from)) console.error(`[voice] ICE candidate failed for ${from}:`, err);
      }
    }
  }

  private closePeer(peerId: string): void {
    this.connections.get(peerId)?.close();
    this.connections.delete(peerId);
    this.polite.delete(peerId);
    this.makingOffer.delete(peerId);
    this.ignoreOffer.delete(peerId);
  }

  leave(): void {
    this.connections.forEach((pc) => pc.close());
    this.connections.clear();
    this.polite.clear();
    this.makingOffer.clear();
    this.ignoreOffer.clear();
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
