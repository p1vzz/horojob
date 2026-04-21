import React from 'react';
import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { JobCheckTile } from './JobCheckTile';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../theme/ThemeModeProvider', () => {
  const theme = {
    isLight: false,
    colors: {
      amethyst: '#5A3ACC',
      border: 'rgba(255,255,255,0.07)',
      cardBg: 'rgba(255,255,255,0.03)',
      foreground: '#D4D4E0',
    },
  };

  return {
    useAppTheme: () => theme,
  };
});

beforeEach(() => {
  mockNavigate.mockClear();
});

test('job check tile presents supported services instead of a dashboard URL input', () => {
  render(<JobCheckTile />);

  expect(screen.queryByPlaceholderText('Paste vacancy URL...')).toBeNull();
  expect(screen.getByText('Supported services')).toBeTruthy();
  expect(screen.getByText('LinkedIn')).toBeTruthy();
  expect(screen.getByText('Wellfound')).toBeTruthy();
  expect(screen.getByText('ZipRecruiter')).toBeTruthy();
  expect(screen.getByText('Indeed')).toBeTruthy();
  expect(screen.getByText('Glassdoor')).toBeTruthy();

  fireEvent.press(screen.getByText('Check a posting'));
  expect(mockNavigate).toHaveBeenCalledWith('Scanner');
});
