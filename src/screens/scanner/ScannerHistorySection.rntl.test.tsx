import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { JobScanHistoryEntry } from '../../utils/jobScanHistoryStorage';
import { ScannerHistorySection } from './ScannerHistorySection';

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

const entry: JobScanHistoryEntry = {
  url: 'https://linkedin.com/jobs/view/123',
  analysis: {
    analysisId: 'analysis-1',
    status: 'done',
    scanDepth: 'full',
    requestedScanDepth: 'auto',
    providerUsed: 'http_fetch',
    cached: false,
    cache: {
      raw: false,
      parsed: false,
      analysis: false,
    },
    usage: {
      plan: 'free',
      depth: 'full',
      incremented: false,
    },
    versions: {
      parserVersion: 'parser-v1',
      rubricVersion: 'rubric-v1',
      modelVersion: 'model-v1',
    },
    scores: {
      compatibility: 81,
      aiReplacementRisk: 22,
      overall: 77,
    },
    breakdown: [],
    jobSummary: 'Normal summary',
    tags: ['remote'],
    market: null,
    job: {
      title: 'Product Designer',
      company: 'Acme',
      location: 'Remote',
      employmentType: 'full-time',
      source: 'linkedin',
    },
  },
  meta: {
    source: 'linkedin',
    cached: false,
    provider: 'http_fetch',
  },
  savedAt: '2026-03-31T10:00:00.000Z',
};

test('scanner history section reopens selected cached entry', () => {
  const onSelect = jest.fn();

  render(<ScannerHistorySection entries={[entry]} onSelect={onSelect} />);

  fireEvent.press(screen.getByText('Product Designer'));
  expect(onSelect).toHaveBeenCalledWith(entry);
  expect(screen.getByText('LINKEDIN | Tap to reopen')).toBeTruthy();
  expect(screen.getByText('Full scan')).toBeTruthy();
});

test('scanner history section shows lite scan badge without score emphasis', () => {
  render(
    <ScannerHistorySection
      entries={[
        {
          ...entry,
          analysis: {
            ...entry.analysis,
            scanDepth: 'lite',
            scores: {
              compatibility: 0,
              aiReplacementRisk: 0,
              overall: 0,
            },
          },
        },
      ]}
      onSelect={() => {}}
    />
  );

  expect(screen.getByText('Lite scan')).toBeTruthy();
  expect(screen.queryByText('0%')).toBeNull();
});
