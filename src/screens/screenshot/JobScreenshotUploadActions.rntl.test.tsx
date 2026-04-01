import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { JobScreenshotUploadActions } from './JobScreenshotUploadActions';

jest.mock('../../theme/ThemeModeProvider', () => {
  const theme = {
    colors: {
      gold: '#C9A84C',
      foreground: '#FFFFFF',
    },
  };

  return {
    useThemeMode: () => ({
      theme,
      colors: theme.colors,
      isLight: false,
      isDark: true,
      isReady: true,
      mode: 'dark',
      setMode: () => {},
      toggleMode: () => {},
    }),
  };
});

test('screenshot upload actions render error text and wire button handlers', () => {
  const onPickScreenshots = jest.fn();
  const onAnalyzePress = jest.fn();

  render(
    <JobScreenshotUploadActions
      canAddMore
      errorText="Media permission is required to upload screenshots."
      hasItems
      isLoading={false}
      onAnalyzePress={onAnalyzePress}
      onPickScreenshots={onPickScreenshots}
    />
  );

  expect(screen.getByText('Media permission is required to upload screenshots.')).toBeTruthy();
  fireEvent.press(screen.getByText('Upload Screenshots'));
  fireEvent.press(screen.getByText('Analyze Screenshots'));
  expect(onPickScreenshots).toHaveBeenCalledTimes(1);
  expect(onAnalyzePress).toHaveBeenCalledTimes(1);
});
