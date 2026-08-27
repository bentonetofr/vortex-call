"use client";

import { IconMenu2, IconPhone, IconUsers, IconVolume2 } from "@tabler/icons-react";
import { useState } from "react";
import type { Channel, Member, Message } from "@/lib/types";
import type { MediaMode, PeerCallState } from "@/lib/useVoiceCall";
import { ChatArea } from "./ChatArea";
import { VoiceStage } from "./VoiceStage";

interface VoiceRoomViewProps {
  channel: Channel;
  messages: Message[];
  members: Member[];
  onSendMessage: (content: string) => void;
  currentMember: Member;
  isConnected: boolean;
  onJoin: () => void;
  localVideoStream: MediaStream | null;
  localAudioStream: MediaStream | null;
  mediaMode: MediaMode;
  micEnabled: boolean;
  peers: Record<string, PeerCallState>;
  onOpenDrawer: () => void;
  onOpenMembers: () => void;
}

export function VoiceRoomView({
  channel,
  messages,
  members,
  onSendMessage,
  currentMember,
  isConnected,
  onJoin,
  localVideoStream,
  localAudioStream,
  mediaMode,
  micEnabled,
  peers,
  onOpenDrawer,
  onOpenMembers,
}: VoiceRoomViewProps) {
  const [mobileTab, setMobileTab] = useState<"stage" | "chat">("stage");

  return (
    <div className="flex min-w-0 flex-1 flex-col md:flex-row">
      <div className="flex items-center gap-2 border-b border-vc-border px-3 py-3 md:hidden">
        <button onClick={onOpenDrawer} className="shrink-0 text-vc-text-muted" aria-label="Abrir menu">
          <IconMenu2 size={20} />
        </button>
        <IconVolume2 size={18} className="shrink-0 text-vc-text-muted" />
        <span className="min-w-0 flex-1 truncate font-medium text-vc-text">{channel.name}</span>
        <button
          onClick={() => setMobileTab((tab) => (tab === "stage" ? "chat" : "stage"))}
          className="shrink-0 rounded-md bg-vc-input px-2.5 py-1 text-xs font-medium text-vc-text"
        >
          {mobileTab === "stage" ? "Chat" : "Palco"}
        </button>
        <button onClick={onOpenMembers} className="shrink-0 text-vc-text-muted" aria-label="Ver membros">
          <IconUsers size={20} />
        </button>
      </div>

      <div className={`min-h-0 flex-col bg-vc-chat md:flex md:flex-1 ${mobileTab === "chat" ? "hidden" : "flex flex-1"}`}>
        {isConnected ? (
          <VoiceStage
            currentMember={currentMember}
            localVideoStream={localVideoStream}
            localAudioStream={localAudioStream}
            localMode={mediaMode}
            micEnabled={micEnabled}
            peers={peers}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <p className="text-sm text-vc-text-muted">Você está vendo {channel.name}, mas não está conectado.</p>
            <button
              onClick={onJoin}
              className="flex items-center gap-2 rounded-md bg-vc-accent px-4 py-2 text-sm font-medium text-vc-sidebar"
            >
              <IconPhone size={16} />
              Entrar na sala de voz
            </button>
          </div>
        )}
      </div>

      <div
        className={`min-h-0 w-full flex-col border-vc-border md:flex md:w-[320px] md:shrink-0 md:border-l ${
          mobileTab === "chat" ? "flex flex-1" : "hidden"
        }`}
      >
        <ChatArea
          channel={channel}
          messages={messages}
          members={members}
          onSendMessage={onSendMessage}
          hideMobileHeader
        />
      </div>
    </div>
  );
}
