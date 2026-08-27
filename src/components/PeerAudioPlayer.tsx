"use client";

import { Fragment, useEffect, useRef } from "react";

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
  peers: Record<string, { audioStream: MediaStream | null; screenAudioStream: MediaStream | null }>;
}

export function PeerAudioPlayer({ peers }: PeerAudioPlayerProps) {
  return (
    <>
      {Object.entries(peers).map(([peerId, peer]) => (
        <Fragment key={peerId}>
          {peer.audioStream && <PeerAudio key={`${peerId}-mic`} stream={peer.audioStream} />}
          {peer.screenAudioStream && <PeerAudio key={`${peerId}-screen`} stream={peer.screenAudioStream} />}
        </Fragment>
      ))}
    </>
  );
}
