import { writeFileSync } from 'node:fs';

// Original additive-synthesis pad, with a fade at both ends for quiet looping.
const sampleRate = 22050;
const seconds = 24;
const sampleCount = sampleRate * seconds;
const audio = Buffer.alloc(44 + sampleCount * 2);
audio.write('RIFF', 0);
audio.writeUInt32LE(audio.length - 8, 4);
audio.write('WAVEfmt ', 8);
audio.writeUInt32LE(16, 16);
audio.writeUInt16LE(1, 20);
audio.writeUInt16LE(1, 22);
audio.writeUInt32LE(sampleRate, 24);
audio.writeUInt32LE(sampleRate * 2, 28);
audio.writeUInt16LE(2, 32);
audio.writeUInt16LE(16, 34);
audio.write('data', 36);
audio.writeUInt32LE(sampleCount * 2, 40);
const frequencies = [130.81, 196, 246.94, 293.66, 392];
for (let index = 0; index < sampleCount; index++) {
  const time = index / sampleRate;
  const fade = Math.min(1, time / 3, (seconds - time) / 3);
  let sample = 0;
  for (const [voice, frequency] of frequencies.entries()) {
    const swell = 0.7 + 0.3 * Math.sin(time * 0.45 + voice);
    sample += Math.sin(2 * Math.PI * frequency * time) * swell * 0.075;
    sample += Math.sin(2 * Math.PI * frequency * 2.001 * time) * swell * 0.012;
  }
  audio.writeInt16LE(Math.round(sample * fade * 32767), 44 + index * 2);
}
writeFileSync(new URL('../public/after-hours.wav', import.meta.url), audio);
