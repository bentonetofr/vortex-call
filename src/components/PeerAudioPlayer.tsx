"use client";

import { Fragment, useEffect, useRef } from "react";

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

interface PeerScreenAudioProps {
  stream: MediaStream;
  volume: number;
  deafened: boolean;
}

function PeerScreenAudio({ stream, volume, deafened }: PeerScreenAudioProps) {
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
  screenVolumes: Record<string, number>;
  deafened: boolean;
}

export function PeerAudioPlayer({ peers, screenVolumes, deafened }: PeerAudioPlayerProps) {
  return (
    <>
      {Object.entries(peers).map(([peerId, peer]) => (
        <Fragment key={peerId}>
          {peer.audioStream && (
            <PeerAudio key={`${peerId}-mic`} stream={peer.audioStream} deafened={deafened} />
          )}
          {peer.screenAudioStream && (
            <PeerScreenAudio
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
