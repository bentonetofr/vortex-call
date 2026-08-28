import assert from "node:assert/strict";
import test from "node:test";
import { MediaStream, MediaStreamTrack, RTCPeerConnection } from "werift";

test("announces the bot audio track inside a MediaStream", async () => {
  const pc = new RTCPeerConnection();
  const track = new MediaStreamTrack({ kind: "audio" });
  const stream = new MediaStream([track]);

  pc.addTransceiver(track, { direction: "sendonly", streams: [stream] });
  const offer = await pc.createOffer();

  assert.match(offer.sdp, new RegExp(`a=msid:${stream.id} ${track.id}`));
  pc.close();
});
