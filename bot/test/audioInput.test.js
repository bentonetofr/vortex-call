import assert from "node:assert/strict";
import test from "node:test";
import { InvalidAudioUrlError, classifyAudioInput } from "../dist/audioInput.js";

test("recognizes common YouTube URLs", () => {
  assert.equal(classifyAudioInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ").kind, "youtube");
  assert.equal(classifyAudioInput("https://youtu.be/dQw4w9WgXcQ").kind, "youtube");
  assert.equal(classifyAudioInput("https://music.youtube.com/watch?v=dQw4w9WgXcQ").kind, "youtube");
});

test("keeps regular HTTP audio URLs as direct inputs", () => {
  const input = classifyAudioInput("https://cdn.example.com/audio/song.mp3");
  assert.deepEqual(input, { kind: "direct", url: "https://cdn.example.com/audio/song.mp3" });
});

test("does not mistake lookalike domains for YouTube", () => {
  assert.equal(classifyAudioInput("https://youtube.com.example.org/video").kind, "direct");
});

test("rejects malformed, non-HTTP and credential-bearing URLs", () => {
  for (const value of ["not a url", "file:///tmp/song.mp3", "https://user:pass@example.com/song.mp3"]) {
    assert.throws(() => classifyAudioInput(value), InvalidAudioUrlError);
  }
});
