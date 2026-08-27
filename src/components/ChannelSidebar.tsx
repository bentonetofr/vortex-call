import { IconHash, IconMicrophone, IconSettings, IconVolume2 } from "@tabler/icons-react";
import type { Channel, Member } from "@/lib/types";
import { Avatar } from "./Avatar";

interface ChannelSidebarProps {
  channels: Channel[];
  members: Member[];
  currentMember: Member;
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
}

export function ChannelSidebar({
  channels,
  members,
  currentMember,
  activeChannelId,
  onSelectChannel,
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
              <IconHash size={16} />
              {channel.name}
            </button>
          );
        })}

        <p className="px-2 pt-4 pb-1 text-xs tracking-wide text-vc-text-muted">Canais de voz</p>
        {voiceChannels.map((channel) => {
          const occupants = members.filter((m) => m.voiceChannelId === channel.id);
          return (
            <div key={channel.id} className="mt-0.5">
              <div className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-vc-text-muted">
                <IconVolume2 size={16} />
                {channel.name}
              </div>
              {occupants.map((member) => (
                <div key={member.id} className="flex items-center gap-1.5 py-0.5 pr-2 pl-6.5">
                  <Avatar name={member.name} color={member.color} size={20} />
                  <span className="flex-1 text-[12.5px] text-vc-text-muted">{member.name}</span>
                  <IconMicrophone size={12} className="text-vc-accent" />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-vc-border bg-vc-sidebar-footer px-2.5 py-2">
        <Avatar name={currentMember.name} color={currentMember.color} size={26} />
        <span className="flex-1 text-[12.5px] text-vc-text">{currentMember.name}</span>
        <IconMicrophone size={16} className="text-vc-text-muted" />
        <IconSettings size={16} className="text-vc-text-muted" />
      </div>
    </div>
  );
}
