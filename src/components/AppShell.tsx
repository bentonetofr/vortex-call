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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false);
  const [screenVolumes, setScreenVolumes] = useState<Record<string, number>>({});
  const channels = useChannels();
  const members = useMembers(member);
  const messages = useMessages(activeChannelId, member.id);
  const voiceCall = useVoiceCall(member);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  function handleOpenVoice(channelId: string) {
    setActiveChannelId(channelId);
    voiceCall.join(channelId);
  }

  function handleSelectChannel(channelId: string) {
    setActiveChannelId(channelId);
  }

  function closeMobileOverlays() {
    setMobileDrawerOpen(false);
    setMobileMembersOpen(false);
  }

  function handleScreenVolumeChange(peerId: string, volume: number) {
    setScreenVolumes((prev) => ({ ...prev, [peerId]: volume }));
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {voiceCall.activeChannelId && (
        <PeerAudioPlayer peers={voiceCall.peers} screenVolumes={screenVolumes} />
      )}

      {(mobileDrawerOpen || mobileMembersOpen) && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={closeMobileOverlays} />
      )}

      <ChannelSidebar
        channels={channels}
        currentMember={member}
        activeChannelId={activeChannelId}
        onSelectChannel={handleSelectChannel}
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
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
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
            onOpenDrawer={() => setMobileDrawerOpen(true)}
            onOpenMembers={() => setMobileMembersOpen(true)}
            screenVolumes={screenVolumes}
            onScreenVolumeChange={handleScreenVolumeChange}
          />
        ) : (
          <ChatArea
            channel={activeChannel}
            messages={messages}
            members={members}
            onSendMessage={(content) => sendMessage(activeChannelId, member.id, content)}
            onOpenDrawer={() => setMobileDrawerOpen(true)}
            onOpenMembers={() => setMobileMembersOpen(true)}
          />
        ))}
      <MemberList members={members} mobileOpen={mobileMembersOpen} onCloseMobile={() => setMobileMembersOpen(false)} />
    </div>
  );
}
