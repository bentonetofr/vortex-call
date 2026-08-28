import { IconHash, IconSettings, IconVolume2, IconX } from "@tabler/icons-react";
import type { Channel, Member } from "@/lib/types";
import type { MediaMode, PeerCallState, ScreenShareOptions } from "@/lib/useVoiceCall";
import type { VoiceRosterEntry } from "@/lib/useVoiceRoster";
import { Avatar } from "./Avatar";
import { VoiceControls } from "./VoiceControls";
import { VoiceOccupantRow } from "./VoiceOccupantRow";

// Preview avatars for a voice channel's occupants (shown before joining):
// only the bottom PREVIEW_VISIBLE_FRACTION of the circle pokes out, the
// rest is clipped above it.
const PREVIEW_AVATAR_SIZE = 16;
const PREVIEW_VISIBLE_FRACTION = 0.85;

interface ChannelSidebarProps {
  channels: Channel[];
  currentMember: Member;
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  activeVoiceChannelId: string | null;
  voicePeers: Record<string, PeerCallState>;
  voiceRoster: Record<string, VoiceRosterEntry[]>;
  localAudioStream: MediaStream | null;
  onJoinVoice: (channelId: string) => void;
  micEnabled: boolean;
  deafened: boolean;
  mediaMode: MediaMode;
  onToggleMic: () => void;
  onToggleDeafen: () => void;
  onToggleCamera: () => void;
  onStartScreenShare: (options: ScreenShareOptions) => void;
  onStopScreenShare: () => void;
  onLeaveVoice: () => void;
  voiceError: string | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
}

export function ChannelSidebar({
  channels,
  currentMember,
  activeChannelId,
  onSelectChannel,
  activeVoiceChannelId,
  voicePeers,
  voiceRoster,
  localAudioStream,
  onJoinVoice,
  micEnabled,
  deafened,
  mediaMode,
  onToggleMic,
  onToggleDeafen,
  onToggleCamera,
  onStartScreenShare,
  onStopScreenShare,
  onLeaveVoice,
  voiceError,
  mobileOpen,
  onCloseMobile,
  onOpenSettings,
}: ChannelSidebarProps) {
  const textChannels = channels.filter((c) => c.type === "text");
  const voiceChannels = channels.filter((c) => c.type === "voice");

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-vc-sidebar transition-transform duration-200 md:static md:z-auto md:w-[220px] md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-vc-border px-4 py-3.5 font-medium text-vc-accent">
        Vortex Call
        <button onClick={onCloseMobile} className="text-vc-text-muted md:hidden" aria-label="Fechar menu">
          <IconX size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 py-1 text-xs tracking-wide text-vc-text-muted">Canais de texto</p>
        {textChannels.map((channel) => {
          const active = channel.id === activeChannelId;
          return (
            <button
              key={channel.id}
              onClick={() => {
                onSelectChannel(channel.id);
                onCloseMobile();
              }}
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
          const preview = voiceRoster[channel.id] ?? [];

          return (
            <div key={channel.id} className="mt-0.5">
              <button
                onClick={() => {
                  onJoinVoice(channel.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ${
                  joined ? "bg-vc-accent-soft text-vc-accent" : "text-vc-text-muted hover:bg-vc-hover hover:text-vc-text"
                }`}
              >
                <IconVolume2 size={16} className="shrink-0" />
                <span className="truncate">{channel.name}</span>
              </button>
              {joined ? (
                <>
                  <VoiceOccupantRow
                    name={currentMember.name}
                    color={currentMember.color}
                    avatarUrl={currentMember.avatarUrl}
                    audioStream={localAudioStream}
                    micEnabled={micEnabled}
                    deafened={deafened}
                    label="Você"
                  />
                  {Object.entries(voicePeers).map(([peerId, peer]) => (
                    <VoiceOccupantRow
                      key={peerId}
                      name={peer.name}
                      color={peer.color}
                      avatarUrl={peer.avatarUrl}
                      audioStream={peer.audioStream}
                      micEnabled={peer.micEnabled}
                      deafened={peer.deafened}
                    />
                  ))}
                </>
              ) : (
                preview.length > 0 && (
                  <div className="flex items-center gap-1 py-0.5 pr-2 pl-6.5">
                    {preview.map((occupant) => (
                      <div
                        key={occupant.userId}
                        title={occupant.name}
                        className="flex items-end justify-center overflow-hidden rounded-b-full"
                        style={{
                          width: PREVIEW_AVATAR_SIZE,
                          height: PREVIEW_AVATAR_SIZE * PREVIEW_VISIBLE_FRACTION,
                        }}
                      >
                        <Avatar
                          name={occupant.name}
                          color={occupant.color}
                          avatarUrl={occupant.avatarUrl}
                          size={PREVIEW_AVATAR_SIZE}
                        />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {activeVoiceChannelId && (
        <VoiceControls
          channelName={channels.find((c) => c.id === activeVoiceChannelId)?.name ?? ""}
          micEnabled={micEnabled}
          deafened={deafened}
          mediaMode={mediaMode}
          onToggleMic={onToggleMic}
          onToggleDeafen={onToggleDeafen}
          onToggleCamera={onToggleCamera}
          onStartScreenShare={onStartScreenShare}
          onStopScreenShare={onStopScreenShare}
          onLeave={onLeaveVoice}
        />
      )}

      <button
        onClick={onOpenSettings}
        className="flex items-center gap-2 border-t border-vc-border bg-vc-sidebar-footer px-2.5 py-2 text-left hover:bg-vc-hover"
      >
        <Avatar name={currentMember.name} color={currentMember.color} avatarUrl={currentMember.avatarUrl} size={26} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-vc-text">{currentMember.name}</span>
        <IconSettings size={16} className="shrink-0 text-vc-text-muted" />
      </button>
    </div>
  );
}
