import { IconX } from "@tabler/icons-react";
import type { Member } from "@/lib/types";
import { Avatar } from "./Avatar";

interface MemberListProps {
  members: Member[];
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function MemberList({ members, mobileOpen, onCloseMobile }: MemberListProps) {
  const online = members.filter((m) => m.online);

  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 flex w-[240px] flex-col overflow-y-auto bg-vc-sidebar px-2.5 py-3.5 transition-transform duration-200 md:static md:z-auto md:w-[190px] md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between px-1.5 pb-2">
        <p className="text-xs tracking-wide text-vc-text-muted">Online — {online.length}</p>
        <button onClick={onCloseMobile} className="text-vc-text-muted md:hidden" aria-label="Fechar membros">
          <IconX size={16} />
        </button>
      </div>
      {online.map((member) => (
        <div key={member.id} className="flex items-center gap-2 rounded-md px-1.5 py-1">
          <Avatar name={member.name} color={member.color} size={24} online={member.online} />
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-vc-text-secondary">{member.name}</span>
        </div>
      ))}
    </div>
  );
}
