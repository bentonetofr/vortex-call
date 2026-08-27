let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(startTime: number, frequency: number, duration: number, peakGain: number) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

export function playJoinSound() {
  const now = getAudioContext().currentTime;
  playTone(now, 523.25, 0.12, 0.15);
  playTone(now + 0.07, 659.25, 0.16, 0.15);
}

export function playLeaveSound() {
  const now = getAudioContext().currentTime;
  playTone(now, 659.25, 0.1, 0.13);
  playTone(now + 0.06, 466.16, 0.16, 0.13);
}

export function playPeerJoinSound() {
  playTone(getAudioContext().currentTime, 784, 0.09, 0.08);
}

export function playPeerLeaveSound() {
  playTone(getAudioContext().currentTime, 392, 0.1, 0.08);
}

export function playMuteSound() {
  playTone(getAudioContext().currentTime, 320, 0.06, 0.1);
}

export function playUnmuteSound() {
  playTone(getAudioContext().currentTime, 540, 0.06, 0.1);
}

export function playMessageSound() {
  const now = getAudioContext().currentTime;
  playTone(now, 880, 0.07, 0.05);
  playTone(now + 0.045, 1174.66, 0.09, 0.05);
}
