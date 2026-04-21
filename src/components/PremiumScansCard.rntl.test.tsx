import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PremiumScansCard } from './PremiumScansCard';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

test('premium scans card advertises expanded daily checks without unlimited copy', () => {
  mockNavigate.mockClear();

  render(<PremiumScansCard />);

  expect(screen.queryByText(/Unlimited/i)).toBeNull();
  expect(screen.queryByText('Deep Reports')).toBeNull();
  expect(screen.queryByText('AI insights')).toBeNull();
  expect(screen.getByText('10 Daily Job Checks')).toBeTruthy();
  expect(screen.getByText('Premium gives you 10 successful checks per day.')).toBeTruthy();

  fireEvent.press(screen.getByText('10 Daily Job Checks'));
  expect(mockNavigate).toHaveBeenCalledWith('PremiumPurchase');
});
