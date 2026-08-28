"use client";

import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconScreenShare,
  IconScreenShareOff,
  IconVideo,
  IconVideoOff,
} from "@tabler/icons-react";
import { useState } from "react";
import type { MediaMode, ScreenShareOptions } from "@/lib/useVoiceCall";
import { DeafenIcon } from "./DeafenIcon";
import { ScreenShareSettingsModal } from "./ScreenShareSettingsModal";

interface VoiceControlsProps {
  channelName: string;
  micEnabled: boolean;
  deafened: boolean;
  mediaMode: MediaMode;
  onToggleMic: () => void;
  onToggleDeafen: () => void;
  onToggleCamera: () => void;
  onStartScreenShare: (options: ScreenShareOptions) => void;
  onStopScreenShare: () => void;
  onLeave: () => void;
}

export function VoiceControls({
  channelName,
  micEnabled,
  deafened,
  mediaMode,
  onToggleMic,
  onToggleDeafen,
  onToggleCamera,
  onStartScreenShare,
  onStopScreenShare,
  onLeave,
}: VoiceControlsProps) {
  const [showScreenShareSettings, setShowScreenShareSettings] = useState(false);

  return (
    <div className="border-t border-vc-border bg-vc-sidebar-footer px-2.5 py-2">
      <p className="truncate px-0.5 pb-1.5 text-[11px] text-vc-online">Conectado a {channelName}</p>
      <div className="flex items-center justify-between gap-1.5">
        <button
          onClick={onToggleMic}
          aria-label={micEnabled ? "Desligar microfone" : "Ligar microfone"}
          className={`flex h-8 w-8 items-center justify-center rounded-md ${micEnabled ? "text-vc-text-muted hover:bg-vc-hover" : "bg-red-500/20 text-red-400"}`}
        >
          {micEnabled ? <IconMicrophone size={16} /> : <IconMicrophoneOff size={16} />}
        </button>
        <button
          onClick={onToggleDeafen}
          aria-label={deafened ? "Reativar áudio e microfone" : "Desativar áudio e microfone"}
          className={`flex h-8 w-8 items-center justify-center rounded-md ${deafened ? "bg-red-500/20 text-red-400" : "text-vc-text-muted hover:bg-vc-hover"}`}
        >
          <DeafenIcon size={16} active={deafened} />
        </button>
        <button
          onClick={onToggleCamera}
          aria-label={mediaMode === "camera" ? "Desligar câmera" : "Ligar câmera"}
          className={`flex h-8 w-8 items-center justify-center rounded-md ${mediaMode === "camera" ? "bg-vc-accent-soft text-vc-accent" : "text-vc-text-muted hover:bg-vc-hover"}`}
        >
          {mediaMode === "camera" ? <IconVideo size={16} /> : <IconVideoOff size={16} />}
        </button>
        <button
          onClick={() => (mediaMode === "screen" ? onStopScreenShare() : setShowScreenShareSettings(true))}
          aria-label={mediaMode === "screen" ? "Parar compartilhamento" : "Compartilhar tela"}
          className={`flex h-8 w-8 items-center justify-center rounded-md ${mediaMode === "screen" ? "bg-vc-accent-soft text-vc-accent" : "text-vc-text-muted hover:bg-vc-hover"}`}
        >
          {mediaMode === "screen" ? <IconScreenShare size={16} /> : <IconScreenShareOff size={16} />}
        </button>
        <button
          onClick={onLeave}
          aria-label="Sair da chamada"
          className="flex h-8 w-8 items-center justify-center rounded-md text-red-400 hover:bg-red-500/20"
        >
          <IconPhoneOff size={16} />
        </button>
      </div>

      {showScreenShareSettings && (
        <ScreenShareSettingsModal
          onCancel={() => setShowScreenShareSettings(false)}
          onConfirm={(options) => {
            setShowScreenShareSettings(false);
            onStartScreenShare(options);
          }}
        />
      )}
    </div>
  );
}
