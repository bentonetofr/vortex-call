"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import {
  playJoinSound,
  playLeaveSound,
  playMuteSound,
  playPeerJoinSound,
  playPeerLeaveSound,
  playUnmuteSound,
} from "./sounds";
import { getIceServers } from "./webrtc";
import type { Member } from "./types";

export type MediaMode = "none" | "camera" | "screen";

export interface PeerCallState {
  audioStream: MediaStream | null;
  videoStream: MediaStream | null;
  mediaMode: MediaMode;
  micEnabled: boolean;
  name: string;
  color: string;
}

interface PresencePayload {
  userId: string;
  name: string;
  color: string;
  micEnabled: boolean;
  mediaMode: MediaMode;
}

interface SignalMessage {
  to: string;
  from: string;
  type: "offer" | "answer" | "ice-candidate";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

const emptyPeer = (name: string, color: string): PeerCallState => ({
  audioStream: null,
  videoStream: null,
  mediaMode: "none",
  micEnabled: true,
  name,
  color,
});

export function useVoiceCall(member: Member) {
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [mediaMode, setMediaMode] = useState<MediaMode>("none");
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerCallState>>({});
  const [error, setError] = useState<string | null>(null);

  const rtcChannelRef = useRef<RealtimeChannel | null>(null);
  const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const politeRef = useRef<Map<string, boolean>>(new Map());
  const makingOfferRef = useRef<Map<string, boolean>>(new Map());
  const ignoreOfferRef = useRef<Map<string, boolean>>(new Map());
  const micStreamRef = useRef<MediaStream | null>(null);
  const videoSendersRef = useRef<Map<string, RTCRtpSender>>(new Map());
  const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  const send = useCallback(
    (message: Omit<SignalMessage, "from">) => {
      rtcChannelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload: { ...message, from: member.id } satisfies SignalMessage,
      });
    },
    [member.id],
  );

  const closePeer = useCallback((peerId: string) => {
    connectionsRef.current.get(peerId)?.close();
    connectionsRef.current.delete(peerId);
    videoSendersRef.current.delete(peerId);
    politeRef.current.delete(peerId);
    makingOfferRef.current.delete(peerId);
    ignoreOfferRef.current.delete(peerId);
    setPeers((prev) => {
      if (!(peerId in prev)) return prev;
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  const ensureConnection = useCallback(
    (peerId: string, meta: { name: string; color: string }) => {
      let pc = connectionsRef.current.get(peerId);
      if (pc) return pc;

      pc = new RTCPeerConnection({ iceServers: getIceServers() });
      connectionsRef.current.set(peerId, pc);
      politeRef.current.set(peerId, member.id < peerId);
      makingOfferRef.current.set(peerId, false);
      ignoreOfferRef.current.set(peerId, false);

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => pc!.addTrack(track, micStreamRef.current!));
      }
      if (localVideoTrackRef.current) {
        const stream = new MediaStream([localVideoTrackRef.current]);
        videoSendersRef.current.set(peerId, pc.addTrack(localVideoTrackRef.current, stream));
      }

      pc.onnegotiationneeded = async () => {
        try {
          makingOfferRef.current.set(peerId, true);
          await pc!.setLocalDescription();
          send({ to: peerId, type: "offer", sdp: pc!.localDescription! });
        } catch (err) {
          console.error("negotiation failed", err);
        } finally {
          makingOfferRef.current.set(peerId, false);
        }
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) send({ to: peerId, type: "ice-candidate", candidate: candidate.toJSON() });
      };

      pc.ontrack = (event) => {
        setPeers((prev) => {
          const existing = prev[peerId] ?? emptyPeer(meta.name, meta.color);
          if (event.track.kind === "audio") {
            return { ...prev, [peerId]: { ...existing, audioStream: event.streams[0] ?? null } };
          }
          return { ...prev, [peerId]: { ...existing, videoStream: event.streams[0] ?? null } };
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc!.connectionState === "failed" || pc!.connectionState === "closed") {
          closePeer(peerId);
        }
      };

      setPeers((prev) => ({ ...prev, [peerId]: prev[peerId] ?? emptyPeer(meta.name, meta.color) }));

      return pc;
    },
    [member.id, send, closePeer],
  );

  const handleSignal = useCallback(
    async (from: string, message: SignalMessage) => {
      // A signal can arrive before this peer's presence sync has run (race),
      // so create the connection on demand — presence will fill in name/color shortly.
      const pc = ensureConnection(from, { name: "...", color: "#888888" });
      const polite = politeRef.current.get(from) ?? false;

      if (message.type === "offer" || message.type === "answer") {
        const collision =
          message.type === "offer" && (makingOfferRef.current.get(from) || pc.signalingState !== "stable");
        const ignore = !polite && collision;
        ignoreOfferRef.current.set(from, ignore);
        if (ignore) return;

        await pc.setRemoteDescription(message.sdp!);
        if (message.type === "offer") {
          await pc.setLocalDescription();
          send({ to: from, type: "answer", sdp: pc.localDescription! });
        }
      } else if (message.type === "ice-candidate" && message.candidate) {
        try {
          await pc.addIceCandidate(message.candidate);
        } catch (err) {
          if (!ignoreOfferRef.current.get(from)) console.error("ice candidate failed", err);
        }
      }
    },
    [send, ensureConnection],
  );

  const leave = useCallback(() => {
    if (rtcChannelRef.current) playLeaveSound();
    connectionsRef.current.forEach((pc) => pc.close());
    connectionsRef.current.clear();
    videoSendersRef.current.clear();
    politeRef.current.clear();
    makingOfferRef.current.clear();
    ignoreOfferRef.current.clear();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    localVideoTrackRef.current?.stop();
    localVideoTrackRef.current = null;
    if (rtcChannelRef.current) {
      getSupabase().removeChannel(rtcChannelRef.current);
      rtcChannelRef.current = null;
    }
    setPeers({});
    setLocalVideoStream(null);
    setLocalAudioStream(null);
    setMediaMode("none");
    setMicEnabled(true);
    setActiveChannelId(null);
  }, []);

  const join = useCallback(
    async (channelId: string) => {
      if (activeChannelId === channelId) return;
      if (activeChannelId) leave();

      setError(null);
      let micStream: MediaStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError("Não deu pra acessar o microfone. Verifique a permissão do navegador.");
        return;
      }
      micStreamRef.current = micStream;
      setLocalAudioStream(micStream);
      setActiveChannelId(channelId);

      const channel = getSupabase().channel(`voice:${channelId}`, {
        config: { presence: { key: member.id }, broadcast: { self: false } },
      });
      rtcChannelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState<PresencePayload>();
          const currentIds = new Set(Object.keys(state));

          for (const peerId of Array.from(connectionsRef.current.keys())) {
            if (!currentIds.has(peerId)) closePeer(peerId);
          }

          for (const [peerId, entries] of Object.entries(state)) {
            if (peerId === member.id) continue;
            const meta = entries[0];
            ensureConnection(peerId, meta);
            setPeers((prev) => ({
              ...prev,
              [peerId]: {
                ...(prev[peerId] ?? emptyPeer(meta.name, meta.color)),
                mediaMode: meta.mediaMode,
                micEnabled: meta.micEnabled,
                name: meta.name,
                color: meta.color,
                videoStream: meta.mediaMode === "none" ? null : (prev[peerId]?.videoStream ?? null),
              },
            }));
          }
        })
        .on("broadcast", { event: "signal" }, ({ payload }) => {
          const message = payload as SignalMessage;
          if (message.to !== member.id) return;
          handleSignal(message.from, message);
        })
        .on("presence", { event: "join" }, ({ key }) => {
          if (key !== member.id) playPeerJoinSound();
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          if (key !== member.id) playPeerLeaveSound();
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              userId: member.id,
              name: member.name,
              color: member.color,
              micEnabled: true,
              mediaMode: "none",
            } satisfies PresencePayload);
            playJoinSound();
          }
        });
    },
    [activeChannelId, leave, member, ensureConnection, closePeer, handleSignal],
  );

  const toggleMic = useCallback(() => {
    const next = !micEnabled;
    micStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicEnabled(next);
    if (next) playUnmuteSound();
    else playMuteSound();
    rtcChannelRef.current?.track({
      userId: member.id,
      name: member.name,
      color: member.color,
      micEnabled: next,
      mediaMode,
    } satisfies PresencePayload);
  }, [micEnabled, mediaMode, member]);

  const setVideoTrack = useCallback(
    (track: MediaStreamTrack | null, mode: MediaMode) => {
      localVideoTrackRef.current?.stop();
      localVideoTrackRef.current = track;
      setLocalVideoStream(track ? new MediaStream([track]) : null);
      setMediaMode(mode);

      connectionsRef.current.forEach((pc, peerId) => {
        const existingSender = videoSendersRef.current.get(peerId);
        if (track) {
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            videoSendersRef.current.set(peerId, pc.addTrack(track, new MediaStream([track])));
          }
        } else if (existingSender) {
          pc.removeTrack(existingSender);
          videoSendersRef.current.delete(peerId);
        }
      });

      rtcChannelRef.current?.track({
        userId: member.id,
        name: member.name,
        color: member.color,
        micEnabled,
        mediaMode: mode,
      } satisfies PresencePayload);
    },
    [micEnabled, member],
  );

  const toggleCamera = useCallback(async () => {
    if (mediaMode === "camera") {
      setVideoTrack(null, "none");
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoTrack(stream.getVideoTracks()[0], "camera");
    } catch {
      setError("Não deu pra acessar a câmera. Verifique a permissão do navegador.");
    }
  }, [mediaMode, setVideoTrack]);

  const toggleScreenShare = useCallback(async () => {
    if (mediaMode === "screen") {
      setVideoTrack(null, "none");
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      track.onended = () => setVideoTrack(null, "none");
      setVideoTrack(track, "screen");
    } catch {
      // User cancelled the screen picker — not an error worth surfacing.
    }
  }, [mediaMode, setVideoTrack]);

  useEffect(() => {
    return () => leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    activeChannelId,
    micEnabled,
    mediaMode,
    peers,
    localVideoStream,
    localAudioStream,
    error,
    join,
    leave,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };
}
