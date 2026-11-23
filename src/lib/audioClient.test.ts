import test from 'node:test';
import assert from 'node:assert/strict';
import {
  downsampleFloat32,
  float32ToPcm16Base64,
  pcm16Base64ToFloat32,
} from './audioClient';

test('downsampleFloat32 passes through 16kHz untouched and downsamples 48kHz to 16kHz', () => {
  const input16 = new Float32Array([0.1, -0.2, 0.3, -0.4]);
  const same = downsampleFloat32(input16, 16000, 16000);
  assert.equal(same, input16);

  const input48 = new Float32Array(300).fill(0.5);
  const down = downsampleFloat32(input48, 48000, 16000);
  assert.equal(down.length, 100);
  assert.ok(Math.abs(down[0] - 0.5) < 1e-6);
});

test('float32ToPcm16Base64 and pcm16Base64ToFloat32 preserve audio signal cleanly', () => {
  const original = new Float32Array([0, 0.25, -0.5, 0.75]);
  const encoded = float32ToPcm16Base64(original, 16000);
  const decoded = pcm16Base64ToFloat32(encoded);

  assert.equal(decoded.length, original.length);
  for (let i = 0; i < original.length; i += 1) {
    assert.ok(Math.abs(decoded[i] - original[i]) < 0.001);
  }
});
