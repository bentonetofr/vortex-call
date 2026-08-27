import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconScreenShare,
  IconScreenShareOff,
  IconVideo,
  IconVideoOff,
} from "@tabler/icons-react";
import type { MediaMode } from "@/lib/useVoiceCall";

interface VoiceControlsProps {
  channelName: string;
  micEnabled: boolean;
  mediaMode: MediaMode;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

export function VoiceControls({
  channelName,
  micEnabled,
  mediaMode,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}: VoiceControlsProps) {
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
          onClick={onToggleCamera}
          aria-label={mediaMode === "camera" ? "Desligar câmera" : "Ligar câmera"}
          className={`flex h-8 w-8 items-center justify-center rounded-md ${mediaMode === "camera" ? "bg-vc-accent-soft text-vc-accent" : "text-vc-text-muted hover:bg-vc-hover"}`}
        >
          {mediaMode === "camera" ? <IconVideo size={16} /> : <IconVideoOff size={16} />}
        </button>
        <button
          onClick={onToggleScreenShare}
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
    </div>
  );
}
