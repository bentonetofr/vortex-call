"use client";

import { IconMicrophone, IconMicrophoneOff } from "@tabler/icons-react";
import { useSpeaking } from "@/lib/useSpeaking";
import { Avatar } from "./Avatar";

interface VoiceOccupantRowProps {
  name: string;
  color: string;
  audioStream: MediaStream | null;
  micEnabled: boolean;
  label?: string;
}

export function VoiceOccupantRow({ name, color, audioStream, micEnabled, label }: VoiceOccupantRowProps) {
  const speaking = useSpeaking(micEnabled ? audioStream : null);

  return (
    <div className="flex items-center gap-1.5 py-0.5 pr-2 pl-6.5">
      <Avatar name={name} color={color} size={20} speaking={speaking} />
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-vc-text-muted">{label ?? name}</span>
      {micEnabled ? (
        <IconMicrophone size={12} className="text-vc-accent" />
      ) : (
        <IconMicrophoneOff size={12} className="text-vc-text-faint" />
      )}
    </div>
  );
}
