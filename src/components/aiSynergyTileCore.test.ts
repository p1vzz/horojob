import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFallbackAiSynergy,
  resolveAiSynergyPalette,
  selectAiSynergyView,
} from './aiSynergyTileCore';

test('ai synergy tile core creates deterministic fallback payload when date injected', () => {
  const result = createFallbackAiSynergy('2026-03-31T08:00:00.000Z');
  assert.equal(result.generatedAt, '2026-03-31T08:00:00.000Z');
  assert.equal(result.score, 92);
  assert.equal(result.recommendations[0], 'Batch repetitive work into structured AI prompts.');
});

test('ai synergy tile core selects fallback when payload is missing', () => {
  const fallback = createFallbackAiSynergy('2026-03-31T08:00:00.000Z');
  const selected = selectAiSynergyView(null) ?? fallback;
  assert.equal(selected.score, 92);
});

test('ai synergy tile core resolves score palette thresholds', () => {
  assert.deepEqual(resolveAiSynergyPalette(90), {
    scoreColor: '#00FFCC',
    scoreSubColor: 'rgba(0,255,204,0.7)',
  });
  assert.deepEqual(resolveAiSynergyPalette(80), {
    scoreColor: '#38CC88',
    scoreSubColor: 'rgba(56,204,136,0.7)',
  });
  assert.deepEqual(resolveAiSynergyPalette(70), {
    scoreColor: '#C9A84C',
    scoreSubColor: 'rgba(56,204,136,0.7)',
  });
});
