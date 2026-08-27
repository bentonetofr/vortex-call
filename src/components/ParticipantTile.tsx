"use client";

import { useEffect, useRef } from "react";
import { IconMicrophoneOff, IconScreenShare } from "@tabler/icons-react";
import { useSpeaking } from "@/lib/useSpeaking";
import { Avatar } from "./Avatar";

interface ParticipantTileProps {
  name: string;
  color: string;
  videoStream: MediaStream | null;
  audioStream: MediaStream | null;
  micEnabled: boolean;
  isScreen?: boolean;
  muted?: boolean;
}

export function ParticipantTile({
  name,
  color,
  videoStream,
  audioStream,
  micEnabled,
  isScreen,
  muted,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const speaking = useSpeaking(micEnabled ? audioStream : null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = videoStream;
  }, [videoStream]);

  return (
    <div
      className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-vc-sidebar transition-shadow"
      style={{ boxShadow: speaking ? "0 0 0 3px #ec4899" : "0 0 0 0 transparent" }}
    >
      {videoStream ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <Avatar name={name} color={color} size={72} />
      )}
      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white">
        {isScreen && <IconScreenShare size={12} className="shrink-0" />}
        <span className="truncate">{name}</span>
      </div>
      {!micEnabled && (
        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/50">
          <IconMicrophoneOff size={12} className="text-red-400" />
        </div>
      )}
    </div>
  );
}
