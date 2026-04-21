import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveStoredThemeModeState } from './themeModeStorageState';

test('theme mode storage state marks persisted light mode as explicit selection', () => {
  assert.deepEqual(resolveStoredThemeModeState('light'), {
    mode: 'light',
    hasExplicitModeSelection: true,
  });
});

test('theme mode storage state marks persisted dark mode as explicit selection', () => {
  assert.deepEqual(resolveStoredThemeModeState('dark'), {
    mode: 'dark',
    hasExplicitModeSelection: true,
  });
});

test('theme mode storage state falls back to dark when no persisted selection exists', () => {
  assert.deepEqual(resolveStoredThemeModeState(null), {
    mode: 'dark',
    hasExplicitModeSelection: false,
  });
});
