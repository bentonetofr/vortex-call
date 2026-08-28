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

interface VoiceCallBarProps {
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

// Floating pill bar over the call stage, Google-Meet style — a second,
// more discoverable way to reach the same controls VoiceControls already
// puts in the sidebar footer, for whoever's focused on the video grid.
export function VoiceCallBar({
  micEnabled,
  deafened,
  mediaMode,
  onToggleMic,
  onToggleDeafen,
  onToggleCamera,
  onStartScreenShare,
  onStopScreenShare,
  onLeave,
}: VoiceCallBarProps) {
  const [showScreenShareSettings, setShowScreenShareSettings] = useState(false);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-vc-sidebar/95 p-2 shadow-lg backdrop-blur">
          <button
            onClick={onToggleMic}
            aria-label={micEnabled ? "Desligar microfone" : "Ligar microfone"}
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              micEnabled ? "text-vc-text-muted hover:bg-vc-hover" : "bg-red-500/20 text-red-400"
            }`}
          >
            {micEnabled ? <IconMicrophone size={18} /> : <IconMicrophoneOff size={18} />}
          </button>
          <button
            onClick={onToggleDeafen}
            aria-label={deafened ? "Reativar áudio e microfone" : "Desativar áudio e microfone"}
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              deafened ? "bg-red-500/20 text-red-400" : "text-vc-text-muted hover:bg-vc-hover"
            }`}
          >
            <DeafenIcon size={18} active={deafened} />
          </button>
          <button
            onClick={onToggleCamera}
            aria-label={mediaMode === "camera" ? "Desligar câmera" : "Ligar câmera"}
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              mediaMode === "camera" ? "bg-vc-accent-soft text-vc-accent" : "text-vc-text-muted hover:bg-vc-hover"
            }`}
          >
            {mediaMode === "camera" ? <IconVideo size={18} /> : <IconVideoOff size={18} />}
          </button>
          <button
            onClick={() => (mediaMode === "screen" ? onStopScreenShare() : setShowScreenShareSettings(true))}
            aria-label={mediaMode === "screen" ? "Parar compartilhamento" : "Compartilhar tela"}
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              mediaMode === "screen" ? "bg-vc-accent-soft text-vc-accent" : "text-vc-text-muted hover:bg-vc-hover"
            }`}
          >
            {mediaMode === "screen" ? <IconScreenShare size={18} /> : <IconScreenShareOff size={18} />}
          </button>
          <button
            onClick={onLeave}
            aria-label="Sair da chamada"
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <IconPhoneOff size={18} />
          </button>
        </div>
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
    </>
  );
}
