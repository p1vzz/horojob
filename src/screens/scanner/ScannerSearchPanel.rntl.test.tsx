import React from 'react';
import { afterEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { ScannerSearchPanel } from './ScannerSearchPanel';

jest.mock('../../theme/ThemeModeProvider', () => {
  const theme = {
    colors: {
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

const sourceHint = {
  tone: 'neutral' as const,
  message: 'Supported sources: LinkedIn, Wellfound, ZipRecruiter, Indeed, Glassdoor.',
};

afterEach(() => {
  jest.restoreAllMocks();
});

test('scanner search panel replaces deep analysis badge with history entry point', () => {
  const onOpenHistory = jest.fn();

  render(
    <ScannerSearchPanel
      url=""
      onChangeUrl={() => {}}
      onScanPress={() => {}}
      isLoading={false}
      sourceHint={sourceHint}
      historicalScan={null}
      onBack={() => {}}
      onOpenHistoricalUrl={() => {}}
      onOpenHistory={onOpenHistory}
    />
  );

  expect(screen.queryByText('Deep Analysis')).toBeNull();
  expect(screen.getByPlaceholderText('Paste vacancy URL...')).toBeTruthy();
  fireEvent.press(screen.getByText('History'));
  expect(onOpenHistory).toHaveBeenCalledTimes(1);
});

test('scanner search panel shows saved scan title and link instead of input for history results', () => {
  const onOpenHistoricalUrl = jest.fn();

  render(
    <ScannerSearchPanel
      url="https://linkedin.com/jobs/view/123"
      onChangeUrl={() => {}}
      onScanPress={() => {}}
      isLoading={false}
      sourceHint={sourceHint}
      historicalScan={{
        title: 'Senior Product Designer',
        url: 'https://linkedin.com/jobs/view/123',
        canOpenUrl: true,
      }}
      onBack={() => {}}
      onOpenHistoricalUrl={onOpenHistoricalUrl}
      onOpenHistory={() => {}}
    />
  );

  expect(screen.queryByPlaceholderText('Paste vacancy URL...')).toBeNull();
  expect(screen.getByText('Senior Product Designer')).toBeTruthy();
  fireEvent.press(screen.getByText('https://linkedin.com/jobs/view/123'));
  expect(onOpenHistoricalUrl).toHaveBeenCalledTimes(1);
});

test('scanner search panel dismisses keyboard before starting scan', () => {
  const onScanPress = jest.fn();
  const dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});

  render(
    <ScannerSearchPanel
      url="https://linkedin.com/jobs/view/123"
      onChangeUrl={() => {}}
      onScanPress={onScanPress}
      isLoading={false}
      sourceHint={sourceHint}
      historicalScan={null}
      onBack={() => {}}
      onOpenHistoricalUrl={() => {}}
      onOpenHistory={() => {}}
    />
  );

  fireEvent.press(screen.getByText('Scan'));
  expect(dismissSpy).toHaveBeenCalledTimes(1);
  expect(onScanPress).toHaveBeenCalledTimes(1);
});
