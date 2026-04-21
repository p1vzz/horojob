import React from 'react';
import { expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { JobScreenshotUploadSummaryCard } from './JobScreenshotUploadSummaryCard';

test('screenshot upload summary explains minimum visible vacancy requirements', () => {
  render(<JobScreenshotUploadSummaryCard itemCount={0} maxScreenshots={6} totalBytesText="0.00 MB" />);

  expect(screen.getByText('Minimum needed')).toBeTruthy();
  expect(screen.getByText('- Role title')).toBeTruthy();
  expect(screen.getByText('- Company name')).toBeTruthy();
  expect(screen.getByText('- Job description or responsibilities')).toBeTruthy();
  expect(screen.getByText('Helpful but optional: location, seniority, employment type.')).toBeTruthy();
  expect(screen.getByText('Total selected: 0/6 (0.00 MB)')).toBeTruthy();
});
