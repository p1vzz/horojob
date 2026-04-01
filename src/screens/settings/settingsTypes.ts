export type SettingsPremiumFeatureId = 'widget' | 'burnout' | 'lunar' | 'calendar';

export type SettingsPremiumFeatureState = {
  activeThumbColor: string;
  activeTrackColor: string;
  busy: boolean;
  detailLines: string[];
  onPress: () => void;
  onTogglePress?: () => void;
  statusAccentColor: string;
  statusLabel: string;
  toggleInteractive: boolean;
  toggleOn: boolean;
};

export type SettingsWeekdayOption = {
  label: string;
  value: number;
};
