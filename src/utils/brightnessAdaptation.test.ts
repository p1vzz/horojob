import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adaptColorOpacity,
  adaptHexOpacity,
  adaptIntensity,
  adaptOpacity,
  adaptRGBA,
} from './brightnessAdaptation';

test('brightness adaptation utility clamps opacity and intensity values', () => {
  assert.equal(adaptOpacity(0.5, 1.4), 0.7);
  assert.equal(adaptOpacity(0.9, 2), 1);
  assert.equal(adaptIntensity(0.7, 1.1), 0.77);
  assert.equal(adaptIntensity(0.7, 2), 1);
});

test('brightness adaptation utility adapts rgba colors by alpha channel', () => {
  assert.equal(adaptRGBA('rgba(255,255,255,0.5)', 1.2), 'rgba(255, 255, 255, 0.600)');
});

test('brightness adaptation utility adapts hex and rgb colors into rgba output', () => {
  assert.equal(adaptColorOpacity('#C9A84C', 0.8), 'rgba(201, 168, 76, 0.800)');
  assert.equal(adaptColorOpacity('#C9A84C80', 0.5), 'rgba(201, 168, 76, 0.251)');
  assert.equal(adaptColorOpacity('rgb(255, 255, 255)', 0.6), 'rgba(255, 255, 255, 0.600)');
  assert.equal(adaptColorOpacity('transparent', 1.2), 'transparent');
});

test('brightness adaptation utility keeps separate hex opacity math available', () => {
  assert.equal(adaptHexOpacity(0.4, 1.25), 0.5);
});
