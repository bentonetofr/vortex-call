export type ChannelType = "text" | "voice";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
}

export interface Member {
  id: string;
  name: string;
  color: string;
  online: boolean;
  voiceChannelId: string | null;
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: string;
}
