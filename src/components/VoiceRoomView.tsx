import { IconPhone } from "@tabler/icons-react";
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
}: VoiceRoomViewProps) {
  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex flex-1 flex-col bg-vc-chat">
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

      <div className="flex w-[320px] shrink-0 flex-col border-l border-vc-border">
        <ChatArea channel={channel} messages={messages} members={members} onSendMessage={onSendMessage} />
      </div>
    </div>
  );
}
