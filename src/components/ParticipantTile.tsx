"use client";

import { useEffect, useRef, useState } from "react";
import { IconDotsVertical, IconMaximize, IconMicrophoneOff, IconScreenShare } from "@tabler/icons-react";
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
  // Your own outgoing mic volume — how loud you sound to everyone else.
  // Only relevant on your own tile.
  ownMicGain?: number;
  onOwnMicGainChange?: (volume: number) => void;
  // How loud this peer's voice sounds to you, locally.
  micVolume?: number;
  onMicVolumeChange?: (volume: number) => void;
  // How loud this peer's screen-share audio sounds to you, locally.
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
  ownMicGain,
  onOwnMicGainChange,
  micVolume,
  onMicVolumeChange,
  volume,
  onVolumeChange,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumePanelRef = useRef<HTMLDivElement>(null);
  const volumeButtonRef = useRef<HTMLButtonElement>(null);
  const [showVolumePanel, setShowVolumePanel] = useState(false);
  const speaking = useSpeaking(micEnabled ? audioStream : null);
  const hasVolumeControls = Boolean(onOwnMicGainChange || onMicVolumeChange || onVolumeChange);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = videoStream;
  }, [videoStream]);

  useEffect(() => {
    if (!showVolumePanel) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (volumePanelRef.current?.contains(target)) return;
      if (volumeButtonRef.current?.contains(target)) return;
      setShowVolumePanel(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showVolumePanel]);

  return (
    <div
      className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-vc-sidebar transition-shadow"
      style={{ boxShadow: speaking ? "0 0 0 3px #ec4899" : "0 0 0 0 transparent" }}
      onContextMenu={
        hasVolumeControls
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
      {hasVolumeControls && (
        <button
          ref={volumeButtonRef}
          onClick={() => setShowVolumePanel((v) => !v)}
          aria-label="Opções de volume"
          className={`absolute bottom-2 flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white hover:bg-black/70 ${
            videoStream ? "right-9" : "right-2"
          }`}
        >
          <IconDotsVertical size={14} />
        </button>
      )}
      {showVolumePanel && hasVolumeControls && (
        <div
          ref={volumePanelRef}
          className="absolute top-2 left-2 z-10 w-44 rounded-lg bg-vc-sidebar/95 p-3 shadow-lg"
          onContextMenu={(e) => e.preventDefault()}
        >
          {onOwnMicGainChange && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-vc-text-muted">
                <span>Seu volume pros outros</span>
                <span>{Math.round((ownMicGain ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={ownMicGain ?? 1}
                onChange={(e) => onOwnMicGainChange(Number(e.target.value))}
                className="w-full accent-vc-accent"
                aria-label="Seu volume pros outros"
              />
            </div>
          )}
          {onMicVolumeChange && (
            <div className={onVolumeChange ? "mb-2.5" : ""}>
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-vc-text-muted">
                <span>Volume do usuário</span>
                <span>{Math.round((micVolume ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={micVolume ?? 1}
                onChange={(e) => onMicVolumeChange(Number(e.target.value))}
                className="w-full accent-vc-accent"
                aria-label="Volume do usuário"
              />
            </div>
          )}
          {onVolumeChange && (
            <div>
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
      )}
    </div>
  );
}
