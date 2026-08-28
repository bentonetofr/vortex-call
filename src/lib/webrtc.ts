const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

export async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch("/api/turn-credentials");
    if (!res.ok) return FALLBACK_ICE_SERVERS;

    const data = await res.json();
    if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      return [...FALLBACK_ICE_SERVERS, ...data.iceServers];
    }
    return FALLBACK_ICE_SERVERS;
  } catch {
    return FALLBACK_ICE_SERVERS;
  }
}
