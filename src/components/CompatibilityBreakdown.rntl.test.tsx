import React from 'react';
import { expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { CompatibilityBreakdown } from './CompatibilityBreakdown';

test('compatibility breakdown renders compact rows with unclamped notes', () => {
  const longNote = 'Strong alignment with the chart indicators, with enough context to explain the factor fully.';

  render(
    <CompatibilityBreakdown
      items={[
        {
          key: 'role_fit',
          label: 'Role Fit',
          score: 76.4,
          note: longNote,
        },
        {
          key: 'growth_potential',
          label: 'Growth Potential',
          score: 54,
          note: 'Lower alignment; expect steeper ramp-up.',
        },
        {
          key: 'stress_load',
          label: 'Stress Load',
          score: 36,
          note: 'Lower alignment; expect pressure points.',
        },
        {
          key: 'ai_resilience',
          label: 'AI Resilience',
          score: 88,
          note: 'Strong alignment with durable skill signals.',
        },
        {
          key: 'extra',
          label: 'Extra Factor',
          score: 92,
        },
      ]}
    />
  );

  expect(screen.getByText('76%')).toBeTruthy();
  expect(screen.getByText(longNote).props.numberOfLines).toBeUndefined();
  expect(screen.queryByText('Extra Factor')).toBeNull();
});
