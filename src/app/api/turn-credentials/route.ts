export async function GET() {
  const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const apiToken = process.env.CLOUDFLARE_TURN_API_TOKEN;

  if (!keyId || !apiToken) {
    return Response.json({ iceServers: [] });
  }

  try {
    const res = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: 86400 }),
      },
    );

    if (!res.ok) {
      return Response.json({ iceServers: [] });
    }

    const data = await res.json();
    return Response.json({ iceServers: data.iceServers ?? [] });
  } catch {
    return Response.json({ iceServers: [] });
  }
}
