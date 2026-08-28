"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconDotsVertical,
  IconMaximize,
  IconMicrophone,
  IconMicrophoneOff,
  IconScreenShare,
} from "@tabler/icons-react";
import { useSpeaking } from "@/lib/useSpeaking";
import { Avatar } from "./Avatar";

const VOLUME_MAX = 2;

interface VolumeSliderProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function VolumeSlider({ icon, label, value, onChange }: VolumeSliderProps) {
  // Displayed percentage is relative to "normal" (value=1 -> 100%, up to
  // 200%); the slider fill is relative to the 0..VOLUME_MAX track range —
  // two different numbers that happen to coincide at value=2 only.
  const displayPct = Math.round(value * 100);
  const fillPct = (value / VOLUME_MAX) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-vc-text-muted">
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="shrink-0 font-medium text-vc-text">{displayPct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={VOLUME_MAX}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="vc-slider"
        style={{
          background: `linear-gradient(to right, var(--color-vc-accent) ${fillPct}%, var(--color-vc-input) ${fillPct}%)`,
        }}
        aria-label={label}
      />
    </div>
  );
}

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
          className="absolute top-2 left-2 z-10 w-52 space-y-3 rounded-xl border border-vc-border bg-vc-sidebar/95 p-3.5 shadow-xl backdrop-blur-sm"
          onContextMenu={(e) => e.preventDefault()}
        >
          {onOwnMicGainChange && (
            <VolumeSlider
              icon={<IconMicrophone size={13} className="shrink-0" />}
              label="Seu volume pros outros"
              value={ownMicGain ?? 1}
              onChange={onOwnMicGainChange}
            />
          )}
          {onMicVolumeChange && (
            <VolumeSlider
              icon={<IconMicrophone size={13} className="shrink-0" />}
              label="Volume do usuário"
              value={micVolume ?? 1}
              onChange={onMicVolumeChange}
            />
          )}
          {onVolumeChange && (
            <VolumeSlider
              icon={<IconScreenShare size={13} className="shrink-0" />}
              label="Volume da transmissão"
              value={volume ?? 1}
              onChange={onVolumeChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
