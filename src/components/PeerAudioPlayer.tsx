"use client";

import { useEffect, useRef } from "react";

interface PeerAudioProps {
  stream: MediaStream;
}

function PeerAudio({ stream }: PeerAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = stream;
  }, [stream]);

  return <audio ref={audioRef} autoPlay />;
}

interface PeerAudioPlayerProps {
  peers: Record<string, { audioStream: MediaStream | null }>;
}

export function PeerAudioPlayer({ peers }: PeerAudioPlayerProps) {
  return (
    <>
      {Object.entries(peers).map(
        ([peerId, peer]) => peer.audioStream && <PeerAudio key={peerId} stream={peer.audioStream} />,
      )}
    </>
  );
}
