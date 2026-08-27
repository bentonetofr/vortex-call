"use client";

import { useState } from "react";
import { ChannelSidebar } from "@/components/ChannelSidebar";
import { ChatArea } from "@/components/ChatArea";
import { MemberList } from "@/components/MemberList";
import {
  CURRENT_MEMBER_ID,
  placeholderChannels,
  placeholderMembers,
  placeholderMessages,
} from "@/lib/placeholder-data";
import type { Message } from "@/lib/types";

export default function Home() {
  const [activeChannelId, setActiveChannelId] = useState("geral");
  const [messages, setMessages] = useState<Message[]>(placeholderMessages);

  const activeChannel = placeholderChannels.find((c) => c.id === activeChannelId)!;
  const currentMember = placeholderMembers.find((m) => m.id === CURRENT_MEMBER_ID)!;
  const channelMessages = messages.filter((m) => m.channelId === activeChannelId);

  function handleSendMessage(content: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        channelId: activeChannelId,
        authorId: CURRENT_MEMBER_ID,
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  return (
    <div className="flex h-screen">
      <ChannelSidebar
        channels={placeholderChannels}
        members={placeholderMembers}
        currentMember={currentMember}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
      />
      <ChatArea
        channel={activeChannel}
        messages={channelMessages}
        members={placeholderMembers}
        onSendMessage={handleSendMessage}
      />
      <MemberList members={placeholderMembers} />
    </div>
  );
}
