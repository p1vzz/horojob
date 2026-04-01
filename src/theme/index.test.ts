import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAppTheme,
  installThemeColorPreprocessors,
  resolveThemeColor,
  setThemeMode,
  syncLegacyTheme,
  theme,
} from './index';

test('createAppTheme returns coherent mode flags', () => {
  const dark = createAppTheme('dark');
  const light = createAppTheme('light');

  assert.equal(dark.mode, 'dark');
  assert.equal(dark.isDark, true);
  assert.equal(dark.isLight, false);

  assert.equal(light.mode, 'light');
  assert.equal(light.isDark, false);
  assert.equal(light.isLight, true);
});

test('syncLegacyTheme and setThemeMode update mutable legacy theme object', () => {
  syncLegacyTheme(createAppTheme('light'));
  assert.equal(theme.mode, 'light');
  assert.equal(theme.isLight, true);
  assert.equal(theme.colors.background, createAppTheme('light').colors.background);

  setThemeMode('dark');
  assert.equal(theme.mode, 'dark');
  assert.equal(theme.isDark, true);
  assert.equal(theme.colors.background, createAppTheme('dark').colors.background);
});

test('resolveThemeColor and installThemeColorPreprocessors stay backward compatible', () => {
  const color = '#FFFFFF';
  assert.equal(resolveThemeColor(color), color);
  assert.doesNotThrow(() => installThemeColorPreprocessors());
});
