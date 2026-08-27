import type { Channel, Member, Message } from "./types";

export const CURRENT_MEMBER_ID = "you";

export const placeholderChannels: Channel[] = [
  { id: "geral", name: "geral", type: "text" },
  { id: "jogos", name: "jogos", type: "text" },
  { id: "memes", name: "memes", type: "text" },
  { id: "sala-1", name: "Sala 1", type: "voice" },
  { id: "sala-2", name: "Sala 2", type: "voice" },
];

export const placeholderMembers: Member[] = [
  { id: "you", name: "Você", color: "#f2c94c", online: true, voiceChannelId: null },
  { id: "bento", name: "Bento", color: "#7b6fc9", online: true, voiceChannelId: "sala-1" },
  { id: "lucas", name: "Lucas", color: "#c9a06f", online: true, voiceChannelId: "sala-1" },
];

export const placeholderMessages: Message[] = [
  {
    id: "1",
    channelId: "geral",
    authorId: "lucas",
    content: "bora jogar hoje?",
    createdAt: "2026-08-27T21:42:00",
  },
  {
    id: "2",
    channelId: "geral",
    authorId: "bento",
    content: "bora, entra na Sala 1",
    createdAt: "2026-08-27T21:44:00",
  },
];
