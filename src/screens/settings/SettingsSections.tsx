import React from 'react';
import { ActivityIndicator, View, Text, Pressable, Switch, TextInput } from 'react-native';
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Clock3,
  Crown,
  Info,
  MapPin,
  MoonStar,
  Sun,
  UserRound,
} from 'lucide-react-native';
import type { WritableCalendarOption } from '../../services/calendar';
import type { SubscriptionPlan } from '../../services/morningBriefingSync';
import type { InterviewStrategySettings } from '../../services/notificationsApi';
import type { InterviewStrategyPlan } from '../../types/interviewStrategy';
import type { OnboardingData } from '../../utils/onboardingStorage';
import type { SettingsPremiumFeatureId, SettingsPremiumFeatureState } from './settingsTypes';
import {
  formatBirthCityLabel,
  formatBirthDateLabel,
  formatBirthNameLabel,
  formatBirthTimeLabel,
  formatCurrentJobTitleLabel,
  formatInterviewCalendarOptionLabel,
  formatInterviewSlotWindow,
  type BirthProfileEditableField,
  type BirthProfileDraft,
} from '../settingsScreenCore';
import { resolveInterviewStrategyTimingLabel } from '../../components/interviewStrategyCore';

type SettingsIcon = React.ComponentType<{ size?: number; color?: string }>;

type BirthRow = {
  label: string;
  value: string;
  Icon: SettingsIcon;
  color: string;
};

export type BirthProfileRecalculationStep = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'failed' | 'skipped';
};

type PremiumFeatureRow = {
  id: SettingsPremiumFeatureId;
  title: string;
  subtitle: string;
  Icon: SettingsIcon;
  iconColor: string;
  iconBg: string;
};

const birthRows: BirthRow[] = [
  { label: 'Name', value: 'Not set', Icon: UserRound, color: '#C9A84C' },
  { label: 'Date of Birth', value: 'Not set', Icon: CalendarDays, color: '#C9A84C' },
  { label: 'Time of Birth', value: 'Not set', Icon: Clock3, color: '#C9A84C' },
  { label: 'Birth City', value: 'Not set', Icon: MapPin, color: '#C9A84C' },
  { label: 'Current Role', value: 'Not set', Icon: BriefcaseBusiness, color: '#C9A84C' },
];

const premiumFeatureRows: PremiumFeatureRow[] = [
  {
    id: 'widget',
    title: 'Career Briefing Widget',
    subtitle: 'Show daily career insights on your home screen',
    Icon: Sun,
    iconColor: '#E6D96B',
    iconBg: 'rgba(230,217,107,0.12)',
  },
  {
    id: 'burnout',
    title: 'Burnout Alerts',
    subtitle: 'Get nudges when workload pressure needs a lighter plan',
    Icon: Bell,
    iconColor: '#FF6B8A',
    iconBg: 'rgba(255,107,138,0.12)',
  },
  {
    id: 'lunar',
    title: 'Lunar Productivity',
    subtitle: 'Get action-ready nudges for strong and disruptive focus windows',
    Icon: MoonStar,
    iconColor: '#F5F7FF',
    iconBg: 'rgba(245,247,255,0.14)',
  },
  {
    id: 'calendar',
    title: 'Interview Strategy',
    subtitle: 'Strong timing for interviews and follow-ups',
    Icon: CalendarClock,
    iconColor: '#7C5CFF',
    iconBg: 'rgba(124,92,255,0.12)',
  },
];

const INTERVIEW_CALENDAR_HELP_TEXT =
  'Horojob saves these reminders to a separate calendar so your main schedule stays clean. Apple Calendar usually shows it right away. Google Calendar may keep new local calendars hidden until you turn on Horojob in the calendar list.';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[11px] tracking-[2.4px] font-semibold px-1 mb-2.5" style={{ color: 'rgba(212,212,224,0.36)' }}>
      {children}
    </Text>
  );
}

export function SettingsAppearanceSection(props: {
  isLightTheme: boolean;
  onToggleTheme: (nextValue: boolean) => void;
}) {
  const { isLightTheme, onToggleTheme } = props;

  return (
    <View className="mb-5">
      <SectionLabel>APPEARANCE</SectionLabel>

      <View
        className="rounded-[18px] overflow-hidden px-4 py-3.5"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-center">
          <View className="flex-1 pr-3">
            <Text className="text-[13px] font-semibold" style={{ color: 'rgba(233,233,242,0.9)' }}>
              Light Theme
            </Text>
            <Text className="text-[12px] mt-0.5" style={{ color: 'rgba(212,212,224,0.52)' }}>
              Use warm light background with inverted contrast
            </Text>
          </View>
          <Switch
            value={isLightTheme}
            onValueChange={onToggleTheme}
            thumbColor={isLightTheme ? '#C9A84C' : 'rgba(212,212,224,0.76)'}
            trackColor={{
              false: 'rgba(255,255,255,0.12)',
              true: 'rgba(201,168,76,0.38)',
            }}
          />
        </View>
      </View>
    </View>
  );
}

type BirthProfileLoadState = 'loading' | 'ready' | 'missing' | 'failed';

function resolveBirthRows(profile: OnboardingData | null, loadState: BirthProfileLoadState): BirthRow[] {
  if (loadState === 'loading') {
    return birthRows.map((row) => ({ ...row, value: 'Loading...' }));
  }
  if (loadState === 'failed') {
    return birthRows.map((row) => ({ ...row, value: 'Unavailable' }));
  }
  if (!profile) {
    return birthRows;
  }

  return [
    { ...birthRows[0], value: formatBirthNameLabel(profile.name) },
    { ...birthRows[1], value: formatBirthDateLabel(profile.birthDate) },
    { ...birthRows[2], value: formatBirthTimeLabel(profile) },
    { ...birthRows[3], value: formatBirthCityLabel(profile) },
    { ...birthRows[4], value: formatCurrentJobTitleLabel(profile.currentJobTitle) },
  ];
}

function resolveBirthStatusLabel(profile: OnboardingData | null, loadState: BirthProfileLoadState) {
  if (loadState === 'loading') return 'Loading';
  if (loadState === 'failed') return 'Unavailable';
  return profile ? 'Saved' : 'Missing';
}

function resolveStepStatusLabel(status: BirthProfileRecalculationStep['status']) {
  switch (status) {
    case 'active':
      return 'Now';
    case 'done':
      return 'Done';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Queued';
  }
}

function resolveStepStatusColor(status: BirthProfileRecalculationStep['status']) {
  switch (status) {
    case 'active':
      return '#C9A84C';
    case 'done':
      return 'rgba(112,225,163,0.86)';
    case 'failed':
      return 'rgba(255,107,138,0.9)';
    case 'skipped':
      return 'rgba(212,212,224,0.38)';
    default:
      return 'rgba(212,212,224,0.34)';
  }
}

export function SettingsBirthDetailsSection(props: {
  draft: BirthProfileDraft;
  editingField: BirthProfileEditableField | null;
  isSaving: boolean;
  lockMessage: string | null;
  profile: OnboardingData | null;
  loadState: BirthProfileLoadState;
  recalculationSteps: BirthProfileRecalculationStep[];
  onCancelEdit: () => void;
  onChangeDraft: (draft: BirthProfileDraft) => void;
  onSave: () => void;
  onStartEdit: (field: BirthProfileEditableField) => void;
}) {
  const {
    draft,
    editingField,
    isSaving,
    lockMessage,
    loadState,
    onCancelEdit,
    onChangeDraft,
    onSave,
    onStartEdit,
    profile,
    recalculationSteps,
  } = props;
  const rows = resolveBirthRows(profile, loadState);
  const isEditing = Boolean(editingField);
  const statusLabel = isSaving ? 'Updating' : isEditing ? 'Editing' : resolveBirthStatusLabel(profile, loadState);
  const canEdit = loadState === 'ready' && Boolean(profile) && !isSaving;
  const renderFieldEditor = (field: BirthProfileEditableField) => (
    <View className="px-4 pb-4" style={{ borderTopColor: 'rgba(255,255,255,0.05)', borderTopWidth: 1 }}>
      <View className="pt-3">
        {field === 'name' ? (
          <TextInput
            value={draft.name}
            onChangeText={(name) => onChangeDraft({ ...draft, name })}
            editable={!isSaving}
            autoCapitalize="words"
            className="text-[14px] rounded-[12px] px-3 py-2.5"
            placeholder="Your name"
            placeholderTextColor="rgba(212,212,224,0.24)"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              color: 'rgba(233,233,242,0.92)',
            }}
          />
        ) : null}

        {field === 'birthDate' ? (
          <TextInput
            value={draft.birthDate}
            onChangeText={(birthDate) => onChangeDraft({ ...draft, birthDate })}
            editable={!isSaving}
            keyboardType="numbers-and-punctuation"
            className="text-[14px] rounded-[12px] px-3 py-2.5"
            placeholder="DD/MM/YYYY"
            placeholderTextColor="rgba(212,212,224,0.24)"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              color: 'rgba(233,233,242,0.92)',
            }}
          />
        ) : null}

        {field === 'birthTime' ? (
          <>
            <TextInput
              value={draft.birthTime}
              onChangeText={(birthTime) => onChangeDraft({ ...draft, birthTime })}
              editable={!isSaving && !draft.unknownTime}
              keyboardType="numbers-and-punctuation"
              className="text-[14px] rounded-[12px] px-3 py-2.5"
              placeholder="HH:MM"
              placeholderTextColor="rgba(212,212,224,0.24)"
              style={{
                backgroundColor: draft.unknownTime ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                color: draft.unknownTime ? 'rgba(212,212,224,0.34)' : 'rgba(233,233,242,0.92)',
              }}
            />
            <Pressable
              onPress={() => onChangeDraft({ ...draft, unknownTime: !draft.unknownTime })}
              disabled={isSaving}
              className="flex-row items-center mt-3 mb-1"
              style={{ opacity: isSaving ? 0.6 : 1 }}
            >
              <View
                className="w-[42px] h-[24px] rounded-full justify-center px-1 mr-3"
                style={{ backgroundColor: draft.unknownTime ? 'rgba(201,168,76,0.32)' : 'rgba(255,255,255,0.08)' }}
              >
                <View
                  className="w-[16px] h-[16px] rounded-full"
                  style={{
                    alignSelf: draft.unknownTime ? 'flex-end' : 'flex-start',
                    backgroundColor: draft.unknownTime ? '#C9A84C' : 'rgba(212,212,224,0.58)',
                  }}
                />
              </View>
              <Text className="text-[12px] font-semibold" style={{ color: 'rgba(233,233,242,0.86)' }}>
                Birth time unknown
              </Text>
            </Pressable>
          </>
        ) : null}

        {field === 'city' ? (
          <TextInput
            value={draft.city}
            onChangeText={(city) => onChangeDraft({ ...draft, city })}
            editable={!isSaving}
            autoCapitalize="words"
            className="text-[14px] rounded-[12px] px-3 py-2.5"
            placeholder="Birth city"
            placeholderTextColor="rgba(212,212,224,0.24)"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              color: 'rgba(233,233,242,0.92)',
            }}
          />
        ) : null}

        {field === 'currentJobTitle' ? (
          <>
            <TextInput
              value={draft.currentJobTitle}
              onChangeText={(currentJobTitle) => onChangeDraft({ ...draft, currentJobTitle })}
              editable={!isSaving}
              autoCapitalize="words"
              className="text-[14px] rounded-[12px] px-3 py-2.5"
              placeholder="Optional current role"
              placeholderTextColor="rgba(212,212,224,0.24)"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                color: 'rgba(233,233,242,0.92)',
              }}
            />
            <Text className="text-[12px] leading-[17px] mt-3" style={{ color: 'rgba(212,212,224,0.52)' }}>
              Optional. This personalizes role transitions and other career guidance across the app.
            </Text>
          </>
        ) : null}
      </View>

      {lockMessage && field !== 'name' && field !== 'currentJobTitle' ? (
        <Text className="text-[12px] leading-[17px] mt-3" style={{ color: 'rgba(255,190,112,0.86)' }}>
          {lockMessage}
        </Text>
      ) : null}

      {recalculationSteps.length > 0 ? (
        <View
          className="rounded-[14px] px-3 py-3 mt-3"
          style={{
            backgroundColor: 'rgba(201,168,76,0.08)',
            borderColor: 'rgba(201,168,76,0.16)',
            borderWidth: 1,
          }}
        >
          <View className="flex-row items-center mb-2">
            {isSaving ? <ActivityIndicator size="small" color="#C9A84C" /> : null}
            <Text className="text-[12px] font-semibold ml-2" style={{ color: 'rgba(233,233,242,0.92)' }}>
              Recalculating profile data
            </Text>
          </View>
          {recalculationSteps.map((step) => (
            <View key={step.id} className="flex-row items-center justify-between py-1">
              <Text className="text-[11px] flex-1 pr-3" style={{ color: 'rgba(212,212,224,0.62)' }}>
                {step.label}
              </Text>
              <Text className="text-[10px] font-semibold uppercase" style={{ color: resolveStepStatusColor(step.status) }}>
                {resolveStepStatusLabel(step.status)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row mt-4">
        <Pressable
          onPress={onCancelEdit}
          disabled={isSaving}
          className="flex-1 rounded-[12px] px-3 py-3 mr-2 items-center"
          style={{
            opacity: isSaving ? 0.55 : 1,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          }}
        >
          <Text className="text-[12px] font-semibold" style={{ color: 'rgba(212,212,224,0.76)' }}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          disabled={isSaving}
          className="flex-1 rounded-[12px] px-3 py-3 ml-2 items-center"
          style={{
            opacity: isSaving ? 0.75 : 1,
            backgroundColor: 'rgba(201,168,76,0.16)',
            borderColor: 'rgba(201,168,76,0.36)',
            borderWidth: 1,
          }}
        >
          <Text className="text-[12px] font-semibold" style={{ color: '#C9A84C' }}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between px-1 mb-2.5">
        <Text className="text-[11px] tracking-[2.4px] font-semibold" style={{ color: 'rgba(212,212,224,0.36)' }}>
          BIRTH DETAILS
        </Text>
        <Text className="text-[12px] font-semibold" style={{ color: '#C9A84C' }}>
          {statusLabel}
        </Text>
      </View>

      <View
        className="rounded-[18px] overflow-hidden"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }}
      >
        {rows.map((row, idx) => {
          const field = ['name', 'birthDate', 'birthTime', 'city', 'currentJobTitle'][idx] as BirthProfileEditableField;
          const isActive = editingField === field;
          return (
            <View
              key={row.label}
              style={{
                borderBottomWidth: idx === birthRows.length - 1 ? 0 : 1,
                borderBottomColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <Pressable
                onPress={() => onStartEdit(field)}
                disabled={!canEdit || isActive}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${row.label}`}
                className="px-4 py-3 flex-row items-center"
                style={{ opacity: !canEdit && !isActive ? 0.72 : 1 }}
              >
                <row.Icon size={15} color={row.color} />
                <Text className="text-[13px] font-semibold ml-3 flex-1" style={{ color: 'rgba(233,233,242,0.9)' }}>
                  {row.label}
                </Text>
                <Text
                  className="text-[13px] text-right ml-3"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ color: 'rgba(212,212,224,0.52)', flexShrink: 1, maxWidth: '46%' }}
                >
                  {row.value}
                </Text>
                {canEdit || isActive ? (
                  <Text className="text-[11px] font-semibold ml-3" style={{ color: '#C9A84C' }}>
                    {isActive ? 'Editing' : 'Edit'}
                  </Text>
                ) : null}
              </Pressable>

              {isActive ? renderFieldEditor(field) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function SettingsSubscriptionSection(props: {
  onOpenPremium: () => void;
  plan: SubscriptionPlan;
}) {
  const { onOpenPremium, plan } = props;

  return (
    <View className="mb-5">
      <SectionLabel>SUBSCRIPTION</SectionLabel>

      <View
        className="rounded-[18px] overflow-hidden"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }}
      >
        <View className="px-4 py-3.5 flex-row items-start">
          <View className="flex-1">
            <Text className="text-[13px] font-semibold" style={{ color: 'rgba(233,233,242,0.9)' }}>
              {plan === 'premium' ? 'Premium Plan' : 'Free Plan'}
            </Text>
            <Text className="text-[12px] mt-0.5" style={{ color: 'rgba(212,212,224,0.48)' }}>
              {plan === 'premium' ? 'Premium features are active for this account' : 'Upgrade to unlock all premium features'}
            </Text>
          </View>
          <Text className="text-[12px]" style={{ color: 'rgba(212,212,224,0.48)' }}>
            {plan === 'premium' ? 'All features unlocked' : 'Limited features'}
          </Text>
        </View>

        {/* TODO(release): route premium management to the production subscription portal/customer center. */}
        <Pressable
          onPress={onOpenPremium}
          className="px-4 py-3.5 flex-row items-center"
          style={{ borderTopColor: 'rgba(255,255,255,0.05)', borderTopWidth: 1 }}
        >
          <Crown size={15} color="#C9A84C" />
          <Text className="text-[13px] font-semibold ml-2 flex-1" style={{ color: '#C9A84C' }}>
            {plan === 'premium' ? 'Manage Premium' : 'Upgrade to Pro'}
          </Text>
          <ChevronRight size={16} color="rgba(201,168,76,0.75)" />
        </Pressable>
      </View>
    </View>
  );
}

export function SettingsPremiumFeaturesSection(props: {
  children?: React.ReactNode;
  featureStates: Record<SettingsPremiumFeatureId, SettingsPremiumFeatureState>;
  footerText: string;
  onOpenWidgetStylePicker: () => void;
  plan: SubscriptionPlan;
  widgetVariantLabel: string;
}) {
  const { children, featureStates, footerText, onOpenWidgetStylePicker, plan, widgetVariantLabel } = props;

  return (
    <View>
      <Text className="text-[12px] leading-[17px] px-1 mb-3" style={{ color: 'rgba(212,212,224,0.42)' }}>
        {footerText}
      </Text>

      <View className="flex-row items-center justify-between px-1 mb-2.5">
        <Text className="text-[11px] tracking-[2.4px] font-semibold" style={{ color: 'rgba(212,212,224,0.36)' }}>
          PREMIUM FEATURES
        </Text>
        <Text className="text-[10px] font-semibold tracking-[1.2px]" style={{ color: 'rgba(212,212,224,0.28)' }}>
          {plan === 'premium' ? 'Active' : 'PRO REQUIRED'}
        </Text>
      </View>

      <View
        className="rounded-[18px] overflow-hidden"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }}
      >
        {premiumFeatureRows.map((row, idx) => {
          const state = featureStates[row.id];

          return (
            <Pressable
              key={row.title}
              onPress={state.onPress}
              disabled={state.busy}
              accessibilityRole="button"
              className="px-4 py-3.5 flex-row items-center"
              style={{
                opacity: state.busy ? 0.85 : 1,
                borderBottomWidth: idx === premiumFeatureRows.length - 1 ? 0 : 1,
                borderBottomColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <View className="w-10 h-10 rounded-[12px] items-center justify-center mr-3" style={{ backgroundColor: row.iconBg }}>
                <row.Icon size={17} color={row.iconColor} />
              </View>
              <View className="flex-1 pr-3">
                <Text className="text-[13px] font-semibold" style={{ color: 'rgba(233,233,242,0.93)' }}>
                  {row.title}
                </Text>
                <Text className="text-[12px] leading-[16px] mt-0.5" style={{ color: 'rgba(212,212,224,0.45)' }}>
                  {row.subtitle}
                </Text>
              </View>

              <View className="items-end">
                <Text
                  className="text-[11px] font-semibold tracking-[0.8px] uppercase"
                  style={{ color: state.statusAccentColor }}
                >
                  {state.statusLabel}
                </Text>
                {state.detailLines.map((line, detailIndex) => (
                  <Text
                    key={`${row.id}:${detailIndex}:${line}`}
                    className="text-[10px] mt-1"
                    numberOfLines={1}
                    style={{ color: 'rgba(212,212,224,0.42)' }}
                  >
                    {line}
                  </Text>
                ))}
                {state.toggleInteractive ? (
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      state.onTogglePress?.();
                    }}
                    disabled={state.busy}
                    hitSlop={8}
                    className="mt-1"
                    style={{ opacity: state.busy ? 0.85 : 1 }}
                  >
                    <View
                      className="w-[42px] h-[24px] rounded-full justify-center px-1"
                      style={{
                        backgroundColor: state.toggleOn ? state.activeTrackColor : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <View
                        className="w-[16px] h-[16px] rounded-full"
                        style={{
                          alignSelf: state.toggleOn ? 'flex-end' : 'flex-start',
                          backgroundColor: state.toggleOn ? state.activeThumbColor : 'rgba(212,212,224,0.58)',
                        }}
                      />
                    </View>
                  </Pressable>
                ) : (
                  <View
                    className="w-[42px] h-[24px] rounded-full justify-center px-1 mt-1"
                    style={{
                      backgroundColor: state.toggleOn ? state.activeTrackColor : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <View
                      className="w-[16px] h-[16px] rounded-full"
                      style={{
                        alignSelf: state.toggleOn ? 'flex-end' : 'flex-start',
                        backgroundColor: state.toggleOn ? state.activeThumbColor : 'rgba(212,212,224,0.58)',
                      }}
                    />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {plan === 'premium' ? (
        <View
          className="mt-3 rounded-[14px] px-3 py-3"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-[10px] tracking-[1.4px] font-semibold mb-1" style={{ color: 'rgba(201,168,76,0.9)' }}>
                WIDGET STYLE
              </Text>
              <Text className="text-[12px] font-semibold" style={{ color: 'rgba(233,233,242,0.92)' }}>
                {widgetVariantLabel}
              </Text>
              <Text className="text-[11px] mt-1" style={{ color: 'rgba(212,212,224,0.54)' }}>
                Includes preview cards for all small, medium, and strip variants.
              </Text>
            </View>
            <Pressable
              onPress={onOpenWidgetStylePicker}
              className="px-3 py-2 rounded-[10px]"
              style={{
                backgroundColor: 'rgba(201,168,76,0.12)',
                borderColor: 'rgba(201,168,76,0.34)',
                borderWidth: 1,
              }}
            >
              <Text className="text-[11px] font-semibold" style={{ color: '#C9A84C' }}>
                Choose
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {children}
    </View>
  );
}

export function SettingsInterviewStrategyPanel(props: {
  interviewCalendarOptions: WritableCalendarOption[];
  interviewPlan: InterviewStrategyPlan | null;
  interviewSelectedCalendarId: string | null;
  interviewSettings: InterviewStrategySettings | null;
  interviewErrorText: string | null;
  hasInterviewCalendarEvents: boolean;
  interviewSyncSummary: string | null;
  isGeneratingInterviewPlan: boolean;
  isInterviewCalendarListVisible: boolean;
  isLoadingInterviewCalendars: boolean;
  isRemovingInterviewCalendarEvents: boolean;
  isSavingInterviewSettings: boolean;
  isSyncingInterviewCalendar: boolean;
  onAddToCalendar: () => void;
  onRemoveFromCalendar: () => void;
  onOpenCalendarPicker: () => void;
  onRetry: () => void;
  onSelectInterviewCalendar: (calendarId: string | null) => void;
  selectedInterviewCalendarOption: WritableCalendarOption | null;
}) {
  const {
    interviewCalendarOptions,
    interviewPlan,
    interviewSelectedCalendarId,
    interviewErrorText,
    hasInterviewCalendarEvents,
    interviewSyncSummary,
    isGeneratingInterviewPlan,
    isInterviewCalendarListVisible,
    isLoadingInterviewCalendars,
    isRemovingInterviewCalendarEvents,
    isSavingInterviewSettings,
    isSyncingInterviewCalendar,
    onAddToCalendar,
    onRemoveFromCalendar,
    onOpenCalendarPicker,
    onRetry,
    onSelectInterviewCalendar,
    selectedInterviewCalendarOption,
  } = props;

  const isCalendarPickerDisabled =
    isSyncingInterviewCalendar ||
    isRemovingInterviewCalendarEvents ||
    isGeneratingInterviewPlan ||
    isSavingInterviewSettings ||
    isLoadingInterviewCalendars;
  const [isCalendarHelpVisible, setIsCalendarHelpVisible] = React.useState(false);
  const handleOpenCalendarPicker = React.useCallback(() => {
    setIsCalendarHelpVisible(false);
    onOpenCalendarPicker();
  }, [onOpenCalendarPicker]);
  const handleSelectInterviewCalendar = React.useCallback(
    (calendarId: string | null) => {
      setIsCalendarHelpVisible(false);
      onSelectInterviewCalendar(calendarId);
    },
    [onSelectInterviewCalendar]
  );
  let strongestInterviewSlotId: string | null = null;
  if (interviewPlan?.slots.length) {
    let strongestSlot = interviewPlan.slots[0];
    for (const slot of interviewPlan.slots) {
      if (slot.score > strongestSlot.score) strongestSlot = slot;
    }
    strongestInterviewSlotId = strongestSlot.id;
  }

  return (
    <View
      className="mt-3 rounded-[14px] px-3 py-3"
      style={{
        backgroundColor: 'rgba(124,92,255,0.08)',
        borderColor: 'rgba(124,92,255,0.24)',
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-[10px] tracking-[1.4px] font-semibold mb-1" style={{ color: 'rgba(160,140,255,0.95)' }}>
            INTERVIEW STRATEGY
          </Text>
          <Text className="text-[12px] font-semibold" style={{ color: 'rgba(233,233,242,0.94)' }}>
            Strong interview timing for the upcoming month
          </Text>
          <Text className="text-[11px] mt-1" style={{ color: 'rgba(212,212,224,0.56)' }}>
            Only days with clear supportive signals are shown
          </Text>
        </View>
        {interviewErrorText ? (
          <Pressable
            onPress={onRetry}
            disabled={isGeneratingInterviewPlan}
            className="px-3 py-2 rounded-[10px]"
            style={{
              backgroundColor: 'rgba(160,140,255,0.16)',
              borderColor: 'rgba(160,140,255,0.34)',
              borderWidth: 1,
              opacity: isGeneratingInterviewPlan ? 0.8 : 1,
            }}
          >
            <Text className="text-[11px] font-semibold" style={{ color: 'rgba(221,214,255,0.98)' }}>
              {isGeneratingInterviewPlan ? 'Retrying...' : 'Retry'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {interviewErrorText ? (
        <View
          className="mt-3 rounded-[10px] px-2.5 py-2.5"
          style={{
            backgroundColor: 'rgba(255,107,107,0.08)',
            borderColor: 'rgba(255,107,107,0.24)',
            borderWidth: 1,
          }}
        >
          <Text className="text-[11px] font-semibold" style={{ color: 'rgba(255,196,196,0.96)' }}>
            Interview windows did not update
          </Text>
          <Text className="text-[10px] mt-1" style={{ color: 'rgba(255,220,220,0.62)' }}>
            {interviewErrorText}
          </Text>
        </View>
      ) : null}

      <View
        className="mt-3 rounded-[10px] px-3 py-2.5"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center mb-0.5">
              <Text className="text-[10px] tracking-[1.1px] font-semibold" style={{ color: 'rgba(212,212,224,0.5)' }}>
                TARGET CALENDAR
              </Text>
              <Pressable
                onPress={() => setIsCalendarHelpVisible((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel="Calendar visibility help"
                className="ml-1.5 p-1 rounded-[8px]"
                hitSlop={8}
                style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
              >
                <Info size={12} color="rgba(212,212,224,0.52)" />
              </Pressable>
            </View>
            <Text className="text-[12px] font-semibold" numberOfLines={1} style={{ color: 'rgba(233,233,242,0.92)' }}>
              {selectedInterviewCalendarOption
                ? formatInterviewCalendarOptionLabel(selectedInterviewCalendarOption)
                : interviewSelectedCalendarId
                  ? 'Selected calendar'
                  : 'Auto (Horojob calendar)'}
            </Text>
          </View>
          <Pressable
            onPress={handleOpenCalendarPicker}
            disabled={isCalendarPickerDisabled}
            className="px-2.5 py-1.5 rounded-[9px]"
            style={{
              backgroundColor: 'rgba(160,140,255,0.18)',
              borderColor: 'rgba(160,140,255,0.42)',
              borderWidth: 1,
              opacity: isLoadingInterviewCalendars ? 0.8 : 1,
            }}
          >
            <Text className="text-[10px] font-semibold" style={{ color: 'rgba(221,214,255,0.98)' }}>
              {isLoadingInterviewCalendars ? 'Loading...' : isInterviewCalendarListVisible ? 'Hide' : 'Choose'}
            </Text>
          </Pressable>
        </View>

        {isCalendarHelpVisible ? (
          <View className="mt-2" style={{ maxWidth: 320 }}>
            <View
              style={{
                width: 10,
                height: 10,
                marginLeft: 84,
                marginBottom: -5,
                backgroundColor: 'rgba(22,20,28,0.98)',
                borderLeftWidth: 1,
                borderTopWidth: 1,
                borderLeftColor: 'rgba(255,255,255,0.08)',
                borderTopColor: 'rgba(255,255,255,0.08)',
                transform: [{ rotate: '45deg' }],
                zIndex: 1,
              }}
            />
            <View
              className="rounded-[12px] px-3 py-2"
              style={{
                backgroundColor: 'rgba(22,20,28,0.98)',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                shadowColor: '#000',
                shadowOpacity: 0.22,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
                elevation: 10,
              }}
            >
              <Text className="text-[11px] leading-[16px]" style={{ color: 'rgba(212,212,224,0.72)' }}>
                {INTERVIEW_CALENDAR_HELP_TEXT}
              </Text>
            </View>
          </View>
        ) : null}

        {isInterviewCalendarListVisible ? (
          <View className="mt-2">
            <Pressable
              onPress={() => handleSelectInterviewCalendar(null)}
              className="rounded-[9px] px-2.5 py-2 mb-2"
              style={{
                backgroundColor: !interviewSelectedCalendarId ? 'rgba(160,140,255,0.16)' : 'rgba(255,255,255,0.03)',
                borderColor: !interviewSelectedCalendarId ? 'rgba(160,140,255,0.5)' : 'rgba(255,255,255,0.1)',
                borderWidth: 1,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-semibold pr-2 flex-1" style={{ color: 'rgba(233,233,242,0.9)' }}>
                  Auto (Horojob calendar)
                </Text>
                {!interviewSelectedCalendarId ? (
                  <Text className="text-[10px] font-semibold" style={{ color: 'rgba(221,214,255,0.9)' }}>
                    Active
                  </Text>
                ) : null}
              </View>
            </Pressable>

            {interviewCalendarOptions.map((option) => {
              const isSelected = option.id === interviewSelectedCalendarId;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelectInterviewCalendar(option.id)}
                  className="rounded-[9px] px-2.5 py-2 mb-2"
                  style={{
                    backgroundColor: isSelected ? 'rgba(160,140,255,0.16)' : 'rgba(255,255,255,0.03)',
                    borderColor: isSelected ? 'rgba(160,140,255,0.5)' : 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] font-semibold pr-2 flex-1" style={{ color: 'rgba(233,233,242,0.9)' }}>
                      {formatInterviewCalendarOptionLabel(option)}
                    </Text>
                    {isSelected ? (
                      <Text className="text-[10px] font-semibold" style={{ color: 'rgba(221,214,255,0.9)' }}>
                        Active
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View className="mt-3">
        <Text className="text-[11px] leading-[17px] mb-2" style={{ color: 'rgba(212,212,224,0.58)' }}>
          Add these windows as calendar reminders. They stay marked as free time, and you can remove Horojob reminders anytime.
        </Text>
        <View className="flex-row">
          <Pressable
            onPress={onAddToCalendar}
            disabled={
              !interviewPlan ||
              interviewPlan.slots.length === 0 ||
              isSavingInterviewSettings ||
              isSyncingInterviewCalendar ||
              isRemovingInterviewCalendarEvents
            }
            className="flex-1 px-3 py-2.5 rounded-[10px] items-center"
            style={{
              backgroundColor: 'rgba(160,140,255,0.16)',
              borderColor: 'rgba(160,140,255,0.38)',
              borderWidth: 1,
              opacity:
                !interviewPlan ||
                interviewPlan.slots.length === 0 ||
                isSavingInterviewSettings ||
                isSyncingInterviewCalendar ||
                isRemovingInterviewCalendarEvents
                  ? 0.62
                  : 1,
            }}
          >
            <Text className="text-[12px] font-semibold" style={{ color: 'rgba(221,214,255,0.98)' }}>
              {isSyncingInterviewCalendar ? 'Syncing...' : 'Add to Calendar'}
            </Text>
          </Pressable>

          {hasInterviewCalendarEvents ? (
            <Pressable
              onPress={onRemoveFromCalendar}
              disabled={isSavingInterviewSettings || isRemovingInterviewCalendarEvents || isSyncingInterviewCalendar}
              className="ml-2 px-3 py-2.5 rounded-[10px] items-center"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.14)',
                borderWidth: 1,
                opacity: isSavingInterviewSettings || isRemovingInterviewCalendarEvents || isSyncingInterviewCalendar ? 0.62 : 1,
              }}
            >
              <Text className="text-[12px] font-semibold" style={{ color: 'rgba(233,233,242,0.82)' }}>
                {isRemovingInterviewCalendarEvents ? 'Removing...' : 'Remove from Calendar'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {interviewSyncSummary ? (
        <Text className="text-[11px] mt-2" style={{ color: 'rgba(212,212,224,0.56)' }}>
          {interviewSyncSummary}
        </Text>
      ) : null}

      {interviewPlan ? (
        interviewPlan.slots.length > 0 ? (
          <View className="mt-3">
            <Text className="text-[10px] tracking-[1.1px] font-semibold mb-2" style={{ color: 'rgba(212,212,224,0.56)' }}>
              RECOMMENDED WINDOWS
            </Text>
            {interviewPlan.slots.slice(0, 6).map((slot) => (
              <View
                key={slot.id}
                className="rounded-[10px] px-2.5 py-2 mb-2"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-semibold pr-2 flex-1" style={{ color: 'rgba(233,233,242,0.9)' }}>
                    {formatInterviewSlotWindow(slot.startAt, slot.endAt)}
                  </Text>
                  <Text className="text-[11px] font-semibold" style={{ color: 'rgba(201,168,76,0.92)' }}>
                    {resolveInterviewStrategyTimingLabel(slot.score, { isTopPick: slot.id === strongestInterviewSlotId })}
                  </Text>
                </View>
                <Text className="text-[10px] mt-1" style={{ color: 'rgba(212,212,224,0.55)' }}>
                  {slot.explanation}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View
            className="mt-3 rounded-[10px] px-2.5 py-2.5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
            }}
          >
            <Text className="text-[11px] font-semibold" style={{ color: 'rgba(233,233,242,0.9)' }}>
              No standout interview windows right now
            </Text>
            <Text className="text-[10px] mt-1" style={{ color: 'rgba(212,212,224,0.55)' }}>
              Nothing in the upcoming month clears our confidence bar. Keep applying normally; we will refresh this automatically.
            </Text>
          </View>
        )
      ) : (
        <Text className="text-[11px] mt-3" style={{ color: 'rgba(212,212,224,0.54)' }}>
          Interview windows are preparing automatically.
        </Text>
      )}
    </View>
  );
}
