import type { Member } from "@/lib/types";
import { Avatar } from "./Avatar";

interface MemberListProps {
  members: Member[];
}

export function MemberList({ members }: MemberListProps) {
  const online = members.filter((m) => m.online);

  return (
    <div className="w-[190px] shrink-0 bg-vc-sidebar px-2.5 py-3.5">
      <p className="px-1.5 pb-2 text-xs tracking-wide text-vc-text-muted">
        Online — {online.length}
      </p>
      {online.map((member) => (
        <div key={member.id} className="flex items-center gap-2 rounded-md px-1.5 py-1">
          <Avatar name={member.name} color={member.color} size={24} online={member.online} />
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-vc-text-secondary">{member.name}</span>
        </div>
      ))}
    </div>
  );
}
