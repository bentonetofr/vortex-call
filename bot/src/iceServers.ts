import { config } from "./config.js";

interface RawIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

// werift's RTCIceServer only accepts a single `urls: string`, unlike the
// browser's (and the TURN endpoint's) `string | string[]` — expand each
// multi-URL entry into one entry per URL, same credentials on each.
interface FlatIceServer {
  urls: string;
  username?: string;
  credential?: string;
}

function flatten(servers: RawIceServer[]): FlatIceServer[] {
  return servers.flatMap((server) =>
    (Array.isArray(server.urls) ? server.urls : [server.urls]).map((urls) => ({
      urls,
      username: server.username,
      credential: server.credential,
    })),
  );
}

const FALLBACK: FlatIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

// Reuses the same /api/turn-credentials endpoint the browser app already
// calls (see src/app/api/turn-credentials/route.ts) instead of duplicating
// Cloudflare TURN credentials into the bot's own environment. The bot
// needs a real TURN relay more often than a browser peer does — it's
// almost never on the same network as anyone.
export async function fetchIceServers(): Promise<FlatIceServer[]> {
  try {
    const res = await fetch(`${config.appUrl}/api/turn-credentials`);
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as { iceServers?: RawIceServer[] };
    if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      return [...FALLBACK, ...flatten(data.iceServers)];
    }
    return FALLBACK;
  } catch {
    return FALLBACK;
  }
}
