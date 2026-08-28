"use client";

import { useEffect, useRef, useState } from "react";
import { IconMaximize, IconMicrophoneOff, IconScreenShare } from "@tabler/icons-react";
import { useSpeaking } from "@/lib/useSpeaking";
import { Avatar } from "./Avatar";

interface ParticipantTileProps {
  name: string;
  color: string;
  avatarUrl: string | null;
  videoStream: MediaStream | null;
  audioStream: MediaStream | null;
  micEnabled: boolean;
  isScreen?: boolean;
  muted?: boolean;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

export function ParticipantTile({
  name,
  color,
  avatarUrl,
  videoStream,
  audioStream,
  micEnabled,
  isScreen,
  muted,
  volume,
  onVolumeChange,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumePanelRef = useRef<HTMLDivElement>(null);
  const [showVolumePanel, setShowVolumePanel] = useState(false);
  const speaking = useSpeaking(micEnabled ? audioStream : null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = videoStream;
  }, [videoStream]);

  useEffect(() => {
    if (!showVolumePanel) return;
    function handlePointerDown(e: PointerEvent) {
      if (volumePanelRef.current && !volumePanelRef.current.contains(e.target as Node)) {
        setShowVolumePanel(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showVolumePanel]);

  return (
    <div
      className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-vc-sidebar transition-shadow"
      style={{ boxShadow: speaking ? "0 0 0 3px #ec4899" : "0 0 0 0 transparent" }}
      onContextMenu={
        onVolumeChange
          ? (e) => {
              e.preventDefault();
              setShowVolumePanel(true);
            }
          : undefined
      }
    >
      {videoStream ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <Avatar name={name} color={color} avatarUrl={avatarUrl} size={72} />
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
      {videoStream && (
        <button
          onClick={() => videoRef.current?.requestFullscreen()}
          aria-label="Tela cheia"
          className="absolute right-2 bottom-2 flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white hover:bg-black/70"
        >
          <IconMaximize size={13} />
        </button>
      )}
      {showVolumePanel && onVolumeChange && (
        <div
          ref={volumePanelRef}
          className="absolute top-2 left-2 z-10 w-40 rounded-lg bg-vc-sidebar/95 p-3 shadow-lg"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-vc-text-muted">
            <span>Volume da transmissão</span>
            <span>{Math.round((volume ?? 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={volume ?? 1}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-full accent-vc-accent"
            aria-label="Volume da transmissão"
          />
        </div>
      )}
    </div>
  );
}
