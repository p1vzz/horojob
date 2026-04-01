import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { ScannerAnalysisSection } from './ScannerAnalysisSection';

jest.mock('../../components/MatchScoreGauge', () => ({
  MatchScoreGauge: () => null,
}));

jest.mock('../../components/ScannerRing', () => ({
  ScannerRing: () => null,
}));

jest.mock('../../components/AiRiskMeter', () => ({
  AiRiskMeter: () => null,
}));

jest.mock('../../components/JobProfileCard', () => ({
  JobProfileCard: () => null,
}));

jest.mock('../../components/CompatibilityBreakdown', () => ({
  CompatibilityBreakdown: () => null,
}));

jest.mock('../../components/InterviewStrategy', () => ({
  InterviewStrategy: () => null,
}));

jest.mock('../../components/PremiumScansCard', () => ({
  PremiumScansCard: () => null,
}));

test('scanner analysis section renders screenshot parsing summary for imported screenshot results', () => {
  render(
    <ScannerAnalysisSection
      analysis={{
        analysisId: 'analysis-1',
        status: 'done',
        providerUsed: 'screenshot_vision',
        cached: false,
        cache: {
          raw: false,
          parsed: false,
          analysis: false,
        },
        usage: {
          plan: 'premium',
          incremented: true,
        },
        versions: {
          parserVersion: 'parser-v1',
          rubricVersion: 'rubric-v1',
          modelVersion: 'model-v1',
        },
        scores: {
          compatibility: 83,
          aiReplacementRisk: 27,
          overall: 79,
        },
        breakdown: [],
        jobSummary: 'Imported screenshot result',
        tags: ['remote'],
        descriptors: ['design'],
        job: {
          title: 'UX Designer',
          company: 'Acme',
          location: 'Remote',
          employmentType: 'contract',
          source: 'manual',
        },
        screenshot: {
          imageCount: 3,
          confidence: 0.84,
          reason: 'Screenshots contained enough vacancy context.',
        },
      }}
    />
  );

  expect(screen.getByText('Screenshot Parsing')).toBeTruthy();
  expect(screen.getByText('Images: 3')).toBeTruthy();
  expect(screen.getByText('Confidence: 84%')).toBeTruthy();
  expect(screen.getByText('Screenshots contained enough vacancy context.')).toBeTruthy();
  expect(screen.getByText('Overall Fit: 79%')).toBeTruthy();
});
