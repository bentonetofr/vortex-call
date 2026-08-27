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

export interface MessageRow {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export function messageFromRow(row: MessageRow): Message {
  return {
    id: row.id,
    channelId: row.channel_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
  };
}
