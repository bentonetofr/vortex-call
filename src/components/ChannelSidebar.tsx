import { IconHash, IconSettings, IconVolume2 } from "@tabler/icons-react";
import type { Channel, Member } from "@/lib/types";
import type { MediaMode, PeerCallState, ScreenShareOptions } from "@/lib/useVoiceCall";
import { Avatar } from "./Avatar";
import { VoiceControls } from "./VoiceControls";
import { VoiceOccupantRow } from "./VoiceOccupantRow";

interface ChannelSidebarProps {
  channels: Channel[];
  currentMember: Member;
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  activeVoiceChannelId: string | null;
  voicePeers: Record<string, PeerCallState>;
  localAudioStream: MediaStream | null;
  onJoinVoice: (channelId: string) => void;
  micEnabled: boolean;
  mediaMode: MediaMode;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onStartScreenShare: (options: ScreenShareOptions) => void;
  onStopScreenShare: () => void;
  onLeaveVoice: () => void;
  voiceError: string | null;
}

export function ChannelSidebar({
  channels,
  currentMember,
  activeChannelId,
  onSelectChannel,
  activeVoiceChannelId,
  voicePeers,
  localAudioStream,
  onJoinVoice,
  micEnabled,
  mediaMode,
  onToggleMic,
  onToggleCamera,
  onStartScreenShare,
  onStopScreenShare,
  onLeaveVoice,
  voiceError,
}: ChannelSidebarProps) {
  const textChannels = channels.filter((c) => c.type === "text");
  const voiceChannels = channels.filter((c) => c.type === "voice");

  return (
    <div className="flex w-[220px] shrink-0 flex-col bg-vc-sidebar">
      <div className="border-b border-vc-border px-4 py-3.5 font-medium text-vc-accent">
        Vortex Call
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 py-1 text-xs tracking-wide text-vc-text-muted">Canais de texto</p>
        {textChannels.map((channel) => {
          const active = channel.id === activeChannelId;
          return (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ${
                active
                  ? "bg-vc-accent-soft font-medium text-vc-accent"
                  : "text-vc-text-muted hover:bg-vc-hover hover:text-vc-text"
              }`}
            >
              <IconHash size={16} className="shrink-0" />
              <span className="truncate">{channel.name}</span>
            </button>
          );
        })}

        <p className="px-2 pt-4 pb-1 text-xs tracking-wide text-vc-text-muted">Canais de voz</p>
        {voiceError && <p className="px-2 pb-1 text-[11px] text-red-400">{voiceError}</p>}
        {voiceChannels.map((channel) => {
          const joined = channel.id === activeVoiceChannelId;

          return (
            <div key={channel.id} className="mt-0.5">
              <button
                onClick={() => onJoinVoice(channel.id)}
                className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ${
                  joined ? "bg-vc-accent-soft text-vc-accent" : "text-vc-text-muted hover:bg-vc-hover hover:text-vc-text"
                }`}
              >
                <IconVolume2 size={16} className="shrink-0" />
                <span className="truncate">{channel.name}</span>
              </button>
              {joined && (
                <>
                  <VoiceOccupantRow
                    name={currentMember.name}
                    color={currentMember.color}
                    audioStream={localAudioStream}
                    micEnabled={micEnabled}
                    label="Você"
                  />
                  {Object.entries(voicePeers).map(([peerId, peer]) => (
                    <VoiceOccupantRow
                      key={peerId}
                      name={peer.name}
                      color={peer.color}
                      audioStream={peer.audioStream}
                      micEnabled={peer.micEnabled}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      {activeVoiceChannelId && (
        <VoiceControls
          channelName={channels.find((c) => c.id === activeVoiceChannelId)?.name ?? ""}
          micEnabled={micEnabled}
          mediaMode={mediaMode}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onStartScreenShare={onStartScreenShare}
          onStopScreenShare={onStopScreenShare}
          onLeave={onLeaveVoice}
        />
      )}

      <div className="flex items-center gap-2 border-t border-vc-border bg-vc-sidebar-footer px-2.5 py-2">
        <Avatar name={currentMember.name} color={currentMember.color} size={26} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-vc-text">{currentMember.name}</span>
        <IconSettings size={16} className="shrink-0 text-vc-text-muted" />
      </div>
    </div>
  );
}
