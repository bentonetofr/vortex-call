"use client";

import { IconHash, IconMenu2, IconPaperclip, IconSend2, IconUsers, IconVolume2 } from "@tabler/icons-react";
import { useState } from "react";
import type { Channel, Member, Message } from "@/lib/types";
import { Avatar } from "./Avatar";

interface ChatAreaProps {
  channel: Channel;
  messages: Message[];
  members: Member[];
  onSendMessage: (content: string) => void;
  onOpenDrawer?: () => void;
  onOpenMembers?: () => void;
  hideMobileHeader?: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ChatArea({
  channel,
  messages,
  members,
  onSendMessage,
  onOpenDrawer,
  onOpenMembers,
  hideMobileHeader,
}: ChatAreaProps) {
  const [draft, setDraft] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    onSendMessage(content);
    setDraft("");
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-vc-chat">
      <div
        className={`items-center gap-2 border-b border-vc-border px-4 py-3 ${
          hideMobileHeader ? "hidden md:flex" : "flex"
        }`}
      >
        {onOpenDrawer && (
          <button onClick={onOpenDrawer} className="-ml-1 shrink-0 text-vc-text-muted md:hidden" aria-label="Abrir menu">
            <IconMenu2 size={20} />
          </button>
        )}
        {channel.type === "voice" ? (
          <IconVolume2 size={18} className="shrink-0 text-vc-text-muted" />
        ) : (
          <IconHash size={18} className="shrink-0 text-vc-text-muted" />
        )}
        <span className="truncate font-medium text-vc-text">{channel.name}</span>
        {onOpenMembers && (
          <button onClick={onOpenMembers} className="ml-auto shrink-0 text-vc-text-muted md:hidden" aria-label="Ver membros">
            <IconUsers size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-3.5">
        {messages.map((message) => {
          const author = members.find((m) => m.id === message.authorId);
          if (!author) return null;
          return (
            <div key={message.id} className="flex gap-2.5">
              <Avatar name={author.name} color={author.color} size={32} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5 text-sm">
                  <span className="truncate font-medium text-vc-accent">{author.name}</span>
                  <span className="shrink-0 text-xs text-vc-text-faint">{formatTime(message.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-[13.5px] break-words text-vc-text-secondary">{message.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-2 pb-3.5">
        <div className="flex items-center gap-2 rounded-lg bg-vc-input px-3 py-2">
          <IconPaperclip size={16} className="text-vc-text-muted" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              channel.type === "voice" ? `Conversar em ${channel.name}` : `Conversar em #${channel.name}`
            }
            className="flex-1 bg-transparent text-sm text-vc-text placeholder:text-vc-text-muted focus:outline-none"
          />
          <button type="submit" aria-label="Enviar mensagem">
            <IconSend2 size={16} className="text-vc-accent" />
          </button>
        </div>
      </form>
    </div>
  );
}
