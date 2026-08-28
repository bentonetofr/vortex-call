const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

export interface AudioInput {
  kind: "direct" | "youtube";
  url: string;
}

export class InvalidAudioUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAudioUrlError";
  }
}

export function classifyAudioInput(rawValue: string): AudioInput {
  let url: URL;
  try {
    url = new URL(rawValue);
  } catch {
    throw new InvalidAudioUrlError("Envie um link HTTP(S) valido.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidAudioUrlError("Somente links HTTP(S) sao aceitos.");
  }
  if (url.username || url.password) {
    throw new InvalidAudioUrlError("Links com usuario ou senha nao sao aceitos.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  return {
    kind: YOUTUBE_HOSTS.has(hostname) ? "youtube" : "direct",
    url: url.toString(),
  };
}
