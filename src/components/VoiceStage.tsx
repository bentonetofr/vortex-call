import type { Member } from "@/lib/types";
import type { MediaMode, PeerCallState } from "@/lib/useVoiceCall";
import { ParticipantTile } from "./ParticipantTile";

interface VoiceStageProps {
  currentMember: Member;
  localVideoStream: MediaStream | null;
  localAudioStream: MediaStream | null;
  localMode: MediaMode;
  micEnabled: boolean;
  peers: Record<string, PeerCallState>;
  micVolumes: Record<string, number>;
  onMicVolumeChange: (peerId: string, volume: number) => void;
  screenVolumes: Record<string, number>;
  onScreenVolumeChange: (peerId: string, volume: number) => void;
}

export function VoiceStage({
  currentMember,
  localVideoStream,
  localAudioStream,
  localMode,
  micEnabled,
  peers,
  micVolumes,
  onMicVolumeChange,
  screenVolumes,
  onScreenVolumeChange,
}: VoiceStageProps) {
  const peerList = Object.entries(peers);

  return (
    <div className="grid flex-1 auto-rows-fr grid-cols-1 gap-3 p-3 md:grid-cols-2 md:gap-4 md:p-6">
      <ParticipantTile
        name={`${currentMember.name} (você)`}
        color={currentMember.color}
        avatarUrl={currentMember.avatarUrl}
        videoStream={localVideoStream}
        audioStream={localAudioStream}
        micEnabled={micEnabled}
        isScreen={localMode === "screen"}
        muted
      />
      {peerList.map(([peerId, peer]) => (
        <ParticipantTile
          key={peerId}
          name={peer.name}
          color={peer.color}
          avatarUrl={peer.avatarUrl}
          videoStream={peer.videoStream}
          audioStream={peer.audioStream}
          micEnabled={peer.micEnabled}
          isScreen={peer.mediaMode === "screen"}
          micVolume={peer.mediaMode === "screen" ? (micVolumes[peerId] ?? 1) : undefined}
          onMicVolumeChange={
            peer.mediaMode === "screen" ? (volume) => onMicVolumeChange(peerId, volume) : undefined
          }
          volume={peer.screenAudioStream ? (screenVolumes[peerId] ?? 1) : undefined}
          onVolumeChange={
            peer.screenAudioStream ? (volume) => onScreenVolumeChange(peerId, volume) : undefined
          }
        />
      ))}
    </div>
  );
}
