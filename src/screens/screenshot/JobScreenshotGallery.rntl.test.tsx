import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { JobScreenshotGallery } from './JobScreenshotGallery';

test('screenshot gallery remove button removes the expected screenshot', () => {
  const onRemove = jest.fn();

  render(
    <JobScreenshotGallery
      items={[
        {
          id: 'shot-1',
          uri: 'file:///shot-1.png',
          dataUrl: 'data:image/png;base64,aaa',
          bytes: 1200,
        },
      ]}
      onRemove={onRemove}
    />
  );

  fireEvent.press(screen.getByLabelText('Remove screenshot 1'));
  expect(onRemove).toHaveBeenCalledWith('shot-1');
});
