"use client";

import { Fragment, useEffect, useRef } from "react";
import type { MediaMode } from "@/lib/useVoiceCall";

interface PeerAudioProps {
  stream: MediaStream;
  deafened: boolean;
}

function PeerAudio({ stream, deafened }: PeerAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = deafened;
  }, [deafened]);

  return <audio ref={audioRef} autoPlay />;
}

interface GainAudioProps {
  stream: MediaStream;
  volume: number;
  deafened: boolean;
}

// Same as PeerAudio but routed through a GainNode so the volume can go
// past 100% — used wherever a per-peer slider (screen-share tile) is
// available, i.e. screen audio always, and mic audio only for someone who
// is currently screen-sharing (see PeerAudioPlayer below).
function GainAudio({ stream, volume, deafened }: GainAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.srcObject = stream;
    audio.muted = true;
    audio.play().catch(() => {});

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    gainRef.current = gain;

    return () => {
      gainRef.current = null;
      source.disconnect();
      gain.disconnect();
      ctx.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = deafened ? 0 : volume;
  }, [volume, deafened]);

  return <audio ref={audioRef} autoPlay />;
}

interface PeerAudioPlayerProps {
  peers: Record<
    string,
    { audioStream: MediaStream | null; screenAudioStream: MediaStream | null; mediaMode: MediaMode }
  >;
  micVolumes: Record<string, number>;
  screenVolumes: Record<string, number>;
  deafened: boolean;
}

export function PeerAudioPlayer({ peers, micVolumes, screenVolumes, deafened }: PeerAudioPlayerProps) {
  return (
    <>
      {Object.entries(peers).map(([peerId, peer]) => (
        <Fragment key={peerId}>
          {peer.audioStream &&
            (peer.mediaMode === "screen" ? (
              <GainAudio
                key={`${peerId}-mic`}
                stream={peer.audioStream}
                volume={micVolumes[peerId] ?? 1}
                deafened={deafened}
              />
            ) : (
              <PeerAudio key={`${peerId}-mic`} stream={peer.audioStream} deafened={deafened} />
            ))}
          {peer.screenAudioStream && (
            <GainAudio
              key={`${peerId}-screen`}
              stream={peer.screenAudioStream}
              volume={screenVolumes[peerId] ?? 1}
              deafened={deafened}
            />
          )}
        </Fragment>
      ))}
    </>
  );
}
