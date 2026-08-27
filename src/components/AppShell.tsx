"use client";

import { useState } from "react";
import { useChannels } from "@/lib/useChannels";
import { useMembers } from "@/lib/useMembers";
import { sendMessage, useMessages } from "@/lib/useMessages";
import { useVoiceCall } from "@/lib/useVoiceCall";
import type { Member } from "@/lib/types";
import { ChannelSidebar } from "./ChannelSidebar";
import { ChatArea } from "./ChatArea";
import { MemberList } from "./MemberList";
import { PeerAudioPlayer } from "./PeerAudioPlayer";
import { VoiceRoomView } from "./VoiceRoomView";

interface AppShellProps {
  member: Member;
}

export function AppShell({ member }: AppShellProps) {
  const [activeChannelId, setActiveChannelId] = useState("geral");
  const channels = useChannels();
  const members = useMembers(member);
  const messages = useMessages(activeChannelId, member.id);
  const voiceCall = useVoiceCall(member);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  function handleOpenVoice(channelId: string) {
    setActiveChannelId(channelId);
    voiceCall.join(channelId);
  }

  return (
    <div className="flex h-screen">
      {voiceCall.activeChannelId && <PeerAudioPlayer peers={voiceCall.peers} />}
      <ChannelSidebar
        channels={channels}
        currentMember={member}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
        activeVoiceChannelId={voiceCall.activeChannelId}
        voicePeers={voiceCall.peers}
        localAudioStream={voiceCall.localAudioStream}
        onJoinVoice={handleOpenVoice}
        micEnabled={voiceCall.micEnabled}
        mediaMode={voiceCall.mediaMode}
        onToggleMic={voiceCall.toggleMic}
        onToggleCamera={voiceCall.toggleCamera}
        onStartScreenShare={voiceCall.startScreenShare}
        onStopScreenShare={voiceCall.stopScreenShare}
        onLeaveVoice={voiceCall.leave}
        voiceError={voiceCall.error}
      />
      {activeChannel &&
        (activeChannel.type === "voice" ? (
          <VoiceRoomView
            channel={activeChannel}
            messages={messages}
            members={members}
            onSendMessage={(content) => sendMessage(activeChannelId, member.id, content)}
            currentMember={member}
            isConnected={voiceCall.activeChannelId === activeChannel.id}
            onJoin={() => voiceCall.join(activeChannel.id)}
            localVideoStream={voiceCall.localVideoStream}
            localAudioStream={voiceCall.localAudioStream}
            mediaMode={voiceCall.mediaMode}
            micEnabled={voiceCall.micEnabled}
            peers={voiceCall.peers}
          />
        ) : (
          <ChatArea
            channel={activeChannel}
            messages={messages}
            members={members}
            onSendMessage={(content) => sendMessage(activeChannelId, member.id, content)}
          />
        ))}
      <MemberList members={members} />
    </div>
  );
}
