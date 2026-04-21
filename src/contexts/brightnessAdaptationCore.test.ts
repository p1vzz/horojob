import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BRIGHTNESS_TIER_HYSTERESIS,
  clampBrightnessSample,
  resolveBrightnessBoostChannels,
  resolveBrightnessTier,
} from './brightnessAdaptationCore';

test('brightness adaptation core clamps invalid brightness samples into safe range', () => {
  assert.equal(clampBrightnessSample(-1), 0);
  assert.equal(clampBrightnessSample(2), 1);
  assert.equal(clampBrightnessSample(Number.NaN), 0.5);
});

test('brightness adaptation core resolves tiers from normalized brightness values', () => {
  assert.equal(resolveBrightnessTier(0.1), 'very-low');
  assert.equal(resolveBrightnessTier(0.3), 'low');
  assert.equal(resolveBrightnessTier(0.55), 'medium');
  assert.equal(resolveBrightnessTier(0.8), 'high');
  assert.equal(resolveBrightnessTier(0.95), 'very-high');
});

test('brightness adaptation core applies hysteresis before changing tiers', () => {
  assert.equal(resolveBrightnessTier(0.43, 'medium'), 'medium');
  assert.equal(resolveBrightnessTier(0.7 + BRIGHTNESS_TIER_HYSTERESIS - 0.01, 'medium'), 'medium');
  assert.equal(resolveBrightnessTier(0.39, 'medium'), 'low');
  assert.equal(resolveBrightnessTier(0.76, 'medium'), 'high');
});

test('brightness adaptation core returns semantic channel multipliers and neutral fallback', () => {
  assert.deepEqual(resolveBrightnessBoostChannels('medium', false), {
    intensityMultiplier: 1,
    textOpacityMultiplier: 1,
    borderOpacityMultiplier: 1,
    glowOpacityMultiplier: 1,
  });

  assert.deepEqual(resolveBrightnessBoostChannels('very-low', true), {
    intensityMultiplier: 1.28,
    textOpacityMultiplier: 1.18,
    borderOpacityMultiplier: 1.24,
    glowOpacityMultiplier: 1.4,
  });
});
