import React from 'react';
import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { SettingsPremiumFeatureId, SettingsPremiumFeatureState } from './settingsTypes';
import {
  SettingsBirthDetailsSection,
  SettingsPremiumFeaturesSection,
} from './SettingsSections';

function createFeatureState(overrides: Partial<SettingsPremiumFeatureState> = {}): SettingsPremiumFeatureState {
  return {
    activeThumbColor: '#fff',
    activeTrackColor: '#333',
    busy: false,
    detailLines: [],
    onPress: () => {},
    statusAccentColor: '#fff',
    statusLabel: 'Off',
    toggleInteractive: false,
    toggleOn: false,
    ...overrides,
  };
}

test('settings birth details section renders loaded profile values and per-field edit affordance', () => {
  const onStartEdit = jest.fn();
  render(
    <SettingsBirthDetailsSection
      draft={{
        name: 'Sam',
        birthDate: '15/06/1990',
        birthTime: '14:30',
        unknownTime: false,
        city: 'New York',
        currentJobTitle: 'Product Manager',
      }}
      editingField={null}
      isSaving={false}
      lockMessage={null}
      loadState="ready"
      profile={{
        name: 'Sam',
        birthDate: '15/06/1990',
        birthTime: '14:30',
        unknownTime: false,
        city: 'New York',
        currentJobTitle: 'Product Manager',
        admin1: 'NY',
        country: 'United States',
      }}
      recalculationSteps={[]}
      onCancelEdit={() => {}}
      onChangeDraft={() => {}}
      onSave={() => {}}
      onStartEdit={onStartEdit}
    />
  );

  expect(screen.getAllByText('Edit').length).toBe(5);
  expect(screen.getByText('Sam')).toBeTruthy();
  expect(screen.getByText('Jun 15, 1990')).toBeTruthy();
  expect(screen.getByText('14:30')).toBeTruthy();
  expect(screen.getByText('New York, NY, United States')).toBeTruthy();
  expect(screen.getByText('Product Manager')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Edit Name'));
  expect(onStartEdit).toHaveBeenCalledWith('name');
});

test('settings birth details section edits one field at a time and renders recalculation steps only for active edit', () => {
  const onChangeDraft = jest.fn();
  const onSave = jest.fn();

  render(
    <SettingsBirthDetailsSection
      draft={{
        name: 'Sam',
        birthDate: '15/06/1990',
        birthTime: '14:30',
        unknownTime: false,
        city: 'New York',
        currentJobTitle: 'Product Manager',
      }}
      editingField="birthTime"
      isSaving
      lockMessage="Birth details are locked after the latest change."
      loadState="ready"
      profile={{
        name: 'Sam',
        birthDate: '15/06/1990',
        birthTime: '14:30',
        unknownTime: false,
        city: 'New York',
        currentJobTitle: 'Product Manager',
      }}
      recalculationSteps={[
        { id: 'save', label: 'Saving birth details', status: 'done' },
        { id: 'natal', label: 'Preparing natal chart', status: 'active' },
      ]}
      onCancelEdit={() => {}}
      onChangeDraft={onChangeDraft}
      onSave={onSave}
      onStartEdit={() => {}}
    />
  );

  expect(screen.queryByDisplayValue('Sam')).toBeNull();
  expect(screen.getByDisplayValue('14:30')).toBeTruthy();
  expect(screen.getByText('Recalculating profile data')).toBeTruthy();
  expect(screen.getByText('Preparing natal chart')).toBeTruthy();
  expect(screen.getByText('Now')).toBeTruthy();
  fireEvent.press(screen.getByText('Birth time unknown'));
  expect(onChangeDraft).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Saving...'));
  expect(onSave).not.toHaveBeenCalled();
});

test('settings birth details section saves name without rendering recalculation steps', () => {
  render(
    <SettingsBirthDetailsSection
      draft={{
        name: 'Sam Lee',
        birthDate: '15/06/1990',
        birthTime: '14:30',
        unknownTime: false,
        city: 'New York',
        currentJobTitle: 'Product Manager',
      }}
      editingField="name"
      isSaving={false}
      lockMessage={null}
      loadState="ready"
      profile={{
        name: 'Sam',
        birthDate: '15/06/1990',
        birthTime: '14:30',
        unknownTime: false,
        city: 'New York',
        currentJobTitle: 'Product Manager',
      }}
      recalculationSteps={[]}
      onCancelEdit={() => {}}
      onChangeDraft={() => {}}
      onSave={() => {}}
      onStartEdit={() => {}}
    />
  );

  expect(screen.getByDisplayValue('Sam Lee')).toBeTruthy();
  expect(screen.queryByText('Recalculating profile data')).toBeNull();
});

test('settings premium feature row ignores presses while busy', () => {
  const onWidgetPress = jest.fn();
  const featureStates: Record<SettingsPremiumFeatureId, SettingsPremiumFeatureState> = {
    widget: createFeatureState({ busy: true, onPress: onWidgetPress, statusLabel: 'Syncing...' }),
    burnout: createFeatureState(),
    lunar: createFeatureState(),
    calendar: createFeatureState(),
  };

  render(
    <SettingsPremiumFeaturesSection
      plan="premium"
      featureStates={featureStates}
      onOpenWidgetStylePicker={() => {}}
      footerText="Manage premium features"
      widgetVariantLabel="Today's Career Vibe (4x2)"
    />
  );

  expect(screen.getByText('Active')).toBeTruthy();
  fireEvent.press(screen.getByText('Career Briefing Widget'));
  expect(onWidgetPress).not.toHaveBeenCalled();
});
