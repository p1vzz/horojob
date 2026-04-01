import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScannerFeedbackCard } from './ScannerFeedbackCard';

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

test('scanner feedback card opens premium upsell from usage limit state', () => {
  const onUpgrade = jest.fn();

  render(
    <ScannerFeedbackCard
      scanSummary={null}
      errorState={{
        code: 'usage_limit_reached',
        message: 'Limit reached',
        retryAt: '2026-04-01T00:00:00.000Z',
        usageContext: 'Usage: 1/1 (daily UTC)',
      }}
      retryAtText="4/1/2026, 12:00:00 AM"
      canUseScreenshotFallback={false}
      hasAnalysis={false}
      isLoading={false}
      onUpgrade={onUpgrade}
      onOpenScreenshotFallback={() => {}}
    />
  );

  fireEvent.press(screen.getByText('Upgrade to Premium'));
  expect(onUpgrade).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Usage: 1/1 (daily UTC)')).toBeTruthy();
});

test('scanner feedback card opens screenshot fallback CTA for supported errors', () => {
  const onOpenScreenshotFallback = jest.fn();

  render(
    <ScannerFeedbackCard
      scanSummary="LINKEDIN - fresh scan"
      errorState={{
        code: 'blocked',
        message: 'Blocked by source',
        retryAt: null,
        usageContext: null,
      }}
      retryAtText={null}
      canUseScreenshotFallback
      hasAnalysis={false}
      isLoading={false}
      onUpgrade={() => {}}
      onOpenScreenshotFallback={onOpenScreenshotFallback}
    />
  );

  expect(screen.getByText('LINKEDIN - fresh scan')).toBeTruthy();
  fireEvent.press(screen.getByText('Upload screenshots instead'));
  expect(onOpenScreenshotFallback).toHaveBeenCalledTimes(1);
});
