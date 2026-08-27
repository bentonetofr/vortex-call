import type { Member } from "@/lib/types";
import type { MediaMode, PeerCallState } from "@/lib/useVoiceCall";
import { ParticipantTile } from "./ParticipantTile";

interface VoiceStageProps {
  currentMember: Member;
  localVideoStream: MediaStream | null;
  localMode: MediaMode;
  micEnabled: boolean;
  peers: Record<string, PeerCallState>;
}

export function VoiceStage({ currentMember, localVideoStream, localMode, micEnabled, peers }: VoiceStageProps) {
  const peerList = Object.entries(peers);

  return (
    <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-4 p-6">
      <ParticipantTile
        name={`${currentMember.name} (você)`}
        color={currentMember.color}
        videoStream={localVideoStream}
        micEnabled={micEnabled}
        isScreen={localMode === "screen"}
        muted
      />
      {peerList.map(([peerId, peer]) => (
        <ParticipantTile
          key={peerId}
          name={peer.name}
          color={peer.color}
          videoStream={peer.videoStream}
          micEnabled={peer.micEnabled}
          isScreen={peer.mediaMode === "screen"}
        />
      ))}
    </div>
  );
}
