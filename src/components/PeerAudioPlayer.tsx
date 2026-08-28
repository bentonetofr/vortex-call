"use client";

import { Fragment, useEffect, useRef } from "react";

interface GainAudioProps {
  stream: MediaStream;
  volume: number;
  deafened: boolean;
}

// Plays a stream through a GainNode instead of relying on <audio>'s own
// volume (which caps at 100%) so per-peer sliders can go past that.
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
  peers: Record<string, { audioStream: MediaStream | null; screenAudioStream: MediaStream | null }>;
  micVolumes: Record<string, number>;
  screenVolumes: Record<string, number>;
  deafened: boolean;
}

export function PeerAudioPlayer({ peers, micVolumes, screenVolumes, deafened }: PeerAudioPlayerProps) {
  return (
    <>
      {Object.entries(peers).map(([peerId, peer]) => (
        <Fragment key={peerId}>
          {peer.audioStream && (
            <GainAudio
              key={`${peerId}-mic`}
              stream={peer.audioStream}
              volume={micVolumes[peerId] ?? 1}
              deafened={deafened}
            />
          )}
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
