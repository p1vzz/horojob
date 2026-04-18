import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  MorningBriefingWidgetVariantPicker,
  currentMorningBriefingVariantLabel,
} from './MorningBriefingWidgetVariantPicker';

test('widget variant picker stays hidden when visible=false', () => {
  render(
    <MorningBriefingWidgetVariantPicker
      visible={false}
      selectedVariantId="medium_vibe"
      briefing={null}
      onSelectVariant={() => {}}
      onConfirm={() => {}}
      onClose={() => {}}
    />
  );

  expect(screen.queryByText('Widget Styles')).toBeNull();
});

test('widget variant picker calls select/confirm/close handlers', () => {
  const onSelectVariant = jest.fn();
  const onConfirm = jest.fn();
  const onClose = jest.fn();

  render(
    <MorningBriefingWidgetVariantPicker
      visible
      selectedVariantId="medium_vibe"
      briefing={null}
      onSelectVariant={onSelectVariant}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );

  fireEvent.press(screen.getByText('Score + timing cues'));
  expect(onSelectVariant).toHaveBeenCalledWith('small_score');

  fireEvent.press(screen.getByText('Use Selected Style'));
  expect(onConfirm).toHaveBeenCalledTimes(1);

  fireEvent.press(screen.getByText('Cancel'));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('widget variant label helper returns title with size', () => {
  expect(currentMorningBriefingVariantLabel('strip_peak')).toContain('4x1');
});
