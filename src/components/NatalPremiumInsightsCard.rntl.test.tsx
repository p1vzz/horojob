import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NatalPremiumInsightsCard } from './NatalPremiumInsightsCard';

jest.mock('../theme/ThemeModeProvider', () => {
  const theme = {
    colors: {
      foreground: '#FFFFFF',
    },
  };

  return {
    useAppTheme: () => theme,
  };
});

test('natal premium insights card presents deep reports and ai insights', () => {
  const onPress = jest.fn();

  render(<NatalPremiumInsightsCard onPress={onPress} />);

  expect(screen.getByText('Deep Reports & AI Insights')).toBeTruthy();
  expect(screen.getByText('Deep Reports')).toBeTruthy();
  expect(screen.getByText('AI Insights')).toBeTruthy();
  expect(screen.queryByText(/10 successful checks/i)).toBeNull();

  fireEvent.press(screen.getByText('Deep Reports & AI Insights'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

