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

jest.mock('../../components/PremiumScansCard', () => ({
  PremiumScansCard: () => null,
}));

test('scanner analysis section renders screenshot parsing summary for imported screenshot results', () => {
  render(
    <ScannerAnalysisSection
      analysis={{
        analysisId: 'analysis-1',
        status: 'done',
        scanDepth: 'full',
        requestedScanDepth: 'auto',
        providerUsed: 'screenshot_vision',
        cached: false,
        cache: {
          raw: false,
          parsed: false,
          analysis: false,
        },
        usage: {
          plan: 'premium',
          depth: 'full',
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
        market: null,
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

test('scanner analysis section renders lite scan market snapshot and locked full panels', () => {
  render(
    <ScannerAnalysisSection
      analysis={{
        analysisId: 'analysis-2',
        status: 'done',
        scanDepth: 'lite',
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
          depth: 'lite',
          incremented: true,
        },
        versions: {
          parserVersion: 'parser-v1',
          rubricVersion: 'rubric-v1',
          modelVersion: 'model-v1',
        },
        scores: {
          compatibility: 0,
          aiReplacementRisk: 0,
          overall: 0,
        },
        breakdown: [],
        jobSummary: 'Market snapshot',
        tags: ['remote'],
        descriptors: ['product'],
        market: {
          query: {
            keyword: 'Product Manager',
            location: 'US',
          },
          occupation: {
            onetCode: '11-2021.00',
            socCode: '112021',
            title: 'Product Managers',
            description: null,
            matchConfidence: 'medium',
          },
          salary: {
            currency: 'USD',
            period: 'annual',
            min: 98000,
            max: 151000,
            median: 124000,
            year: '2024',
            confidence: 'high',
            basis: 'market_estimate',
          },
          outlook: {
            growthLabel: 'Bright',
            projectedOpenings: 22100,
            projectionYears: '2023-2033',
            demandLabel: 'high',
          },
          skills: [
            {
              name: 'Strategy',
              category: 'skill',
              sourceProvider: 'careeronestop',
            },
          ],
          labels: {
            marketScore: 'strong market',
            salaryVisibility: 'market_estimate',
          },
          sources: [
            {
              provider: 'careeronestop',
              label: 'CareerOneStop',
              url: 'https://www.careeronestop.org/',
              retrievedAt: '2026-04-22T00:00:00.000Z',
              attributionText: 'CareerOneStop citation.',
              logoRequired: true,
            },
          ],
        },
        job: {
          title: 'Product Manager',
          company: 'Acme',
          location: 'Remote',
          employmentType: 'full-time',
          source: 'linkedin',
        },
      }}
    />
  );

  expect(screen.getByText('Lite scan')).toBeTruthy();
  expect(screen.getByText('Market Snapshot')).toBeTruthy();
  expect(screen.getByText('Product Managers')).toBeTruthy();
  expect(screen.getByText('Compatibility score')).toBeTruthy();
  expect(screen.getByLabelText('CareerOneStop logo')).toBeTruthy();
  expect(screen.getByLabelText('O*NET logo')).toBeTruthy();
  expect(
    screen.getByText(
      'Market data provided by CareerOneStop, with required public source attribution included. Horojob guidance is independently generated.',
    ),
  ).toBeTruthy();
  expect(screen.queryByText('Overall Fit: 0%')).toBeNull();
});
