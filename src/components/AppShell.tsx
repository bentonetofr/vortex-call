"use client";

import { useState } from "react";
import { useChannels } from "@/lib/useChannels";
import { useMembers } from "@/lib/useMembers";
import { sendMessage, useMessages } from "@/lib/useMessages";
import type { Member } from "@/lib/types";
import { ChannelSidebar } from "./ChannelSidebar";
import { ChatArea } from "./ChatArea";
import { MemberList } from "./MemberList";

interface AppShellProps {
  member: Member;
}

export function AppShell({ member }: AppShellProps) {
  const [activeChannelId, setActiveChannelId] = useState("geral");
  const channels = useChannels();
  const members = useMembers(member);
  const messages = useMessages(activeChannelId);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  return (
    <div className="flex h-screen">
      <ChannelSidebar
        channels={channels}
        members={members}
        currentMember={member}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
      />
      {activeChannel && (
        <ChatArea
          channel={activeChannel}
          messages={messages}
          members={members}
          onSendMessage={(content) => sendMessage(activeChannelId, member.id, content)}
        />
      )}
      <MemberList members={members} />
    </div>
  );
}
