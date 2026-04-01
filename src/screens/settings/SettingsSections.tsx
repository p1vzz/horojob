import React from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import {
  Bell,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Clock3,
  Crown,
  MapPin,
  MoonStar,
  Sun,
} from 'lucide-react-native';
import type { MorningBriefingResponse } from '../../services/astrologyApi';
import type { WritableCalendarOption } from '../../services/calendar';
import type { SubscriptionPlan } from '../../services/morningBriefingSync';
import type { InterviewStrategySettings } from '../../services/notificationsApi';
import type { InterviewStrategyPlan, InterviewStrategyPreferences } from '../../types/interviewStrategy';
import type { SettingsPremiumFeatureId, SettingsPremiumFeatureState, SettingsWeekdayOption } from './settingsTypes';
import {
  formatInterviewCalendarOptionLabel,
  formatInterviewSlotWindow,
  formatMinuteLabel,
} from '../settingsScreenCore';

type SettingsIcon = React.ComponentType<{ size?: number; color?: string }>;

type BirthRow = {
  label: string;
  value: string;
  Icon: SettingsIcon;
  color: string;
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
  { label: 'Date of Birth', value: 'Jun 15, 1990', Icon: CalendarDays, color: '#C9A84C' },
  { label: 'Time of Birth', value: '14:30', Icon: Clock3, color: '#C9A84C' },
  { label: 'Birth City', value: 'New York', Icon: MapPin, color: '#C9A84C' },
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
    subtitle: 'Receive push notifications for energy warnings',
    Icon: Bell,
    iconColor: '#FF6B8A',
    iconBg: 'rgba(255,107,138,0.12)',
  },
  {
    id: 'lunar',
    title: 'Lunar Productivity',
    subtitle: 'Receive moon-adapted focus and workload alerts',
    Icon: MoonStar,
    iconColor: '#F5F7FF',
    iconBg: 'rgba(245,247,255,0.14)',
  },
  {
    id: 'calendar',
    title: 'Interview Strategy',
    subtitle: 'Generate and sync best interview windows',
    Icon: CalendarClock,
    iconColor: '#7C5CFF',
    iconBg: 'rgba(124,92,255,0.12)',
  },
];

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

export function SettingsBirthDetailsSection() {
  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between px-1 mb-2.5">
        <Text className="text-[11px] tracking-[2.4px] font-semibold" style={{ color: 'rgba(212,212,224,0.36)' }}>
          BIRTH DETAILS
        </Text>
        <Text className="text-[12px] font-semibold" style={{ color: '#C9A84C' }}>
          Edit
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
        {birthRows.map((row, idx) => (
          <View
            key={row.label}
            className="px-4 py-3 flex-row items-center"
            style={{
              borderBottomWidth: idx === birthRows.length - 1 ? 0 : 1,
              borderBottomColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <row.Icon size={15} color={row.color} />
            <Text className="text-[13px] font-semibold ml-3 flex-1" style={{ color: 'rgba(233,233,242,0.9)' }}>
              {row.label}
            </Text>
            <Text className="text-[13px]" style={{ color: 'rgba(212,212,224,0.52)' }}>
              {row.value}
            </Text>
          </View>
        ))}
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
  latestBriefing: MorningBriefingResponse | null;
  onOpenWidgetStylePicker: () => void;
  plan: SubscriptionPlan;
  widgetVariantLabel: string;
}) {
  const { children, featureStates, footerText, latestBriefing, onOpenWidgetStylePicker, plan, widgetVariantLabel } = props;

  return (
    <View>
      <View className="flex-row items-center justify-between px-1 mb-2.5">
        <Text className="text-[11px] tracking-[2.4px] font-semibold" style={{ color: 'rgba(212,212,224,0.36)' }}>
          PREMIUM FEATURES
        </Text>
        <Text className="text-[10px] font-semibold tracking-[1.2px]" style={{ color: 'rgba(212,212,224,0.28)' }}>
          PRO REQUIRED
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

      {plan === 'premium' && latestBriefing ? (
        <View
          className="mt-3 rounded-[14px] px-3 py-3"
          style={{
            backgroundColor: 'rgba(201,168,76,0.08)',
            borderColor: 'rgba(201,168,76,0.14)',
            borderWidth: 1,
          }}
        >
          <Text className="text-[10px] tracking-[1.4px] font-semibold mb-1" style={{ color: 'rgba(201,168,76,0.9)' }}>
            LATEST MORNING BRIEFING
          </Text>
          <Text className="text-[12px] font-semibold mb-1" style={{ color: 'rgba(233,233,242,0.92)' }}>
            {latestBriefing.headline}
          </Text>
          <Text className="text-[12px] leading-[17px]" style={{ color: 'rgba(212,212,224,0.58)' }}>
            {latestBriefing.summary}
          </Text>
        </View>
      ) : null}

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

      <Text className="text-center text-[12px] mt-4" style={{ color: 'rgba(212,212,224,0.24)' }}>
        {footerText}
      </Text>
    </View>
  );
}

export function SettingsInterviewStrategyPanel(props: {
  durationOptions: Array<InterviewStrategyPreferences['slotDurationMinutes']>;
  interviewCalendarOptions: WritableCalendarOption[];
  interviewPlan: InterviewStrategyPlan | null;
  interviewPreferences: InterviewStrategyPreferences;
  interviewSelectedCalendarId: string | null;
  interviewSettings: InterviewStrategySettings | null;
  interviewSyncSummary: string | null;
  isGeneratingInterviewPlan: boolean;
  isInterviewCalendarListVisible: boolean;
  isLoadingInterviewCalendars: boolean;
  isSavingInterviewSettings: boolean;
  isSyncingInterviewCalendar: boolean;
  onAddToCalendar: () => void;
  onCycleWorkdayEnd: () => void;
  onCycleWorkdayStart: () => void;
  onDurationChange: (duration: InterviewStrategyPreferences['slotDurationMinutes']) => void;
  onGenerate: () => void;
  onOpenCalendarPicker: () => void;
  onResetPreferences: () => void;
  onSelectInterviewCalendar: (calendarId: string | null) => void;
  onWeekdayToggle: (weekday: number) => void;
  onWidenWindow: () => void;
  selectedInterviewCalendarOption: WritableCalendarOption | null;
  weekdayOptions: SettingsWeekdayOption[];
}) {
  const {
    durationOptions,
    interviewCalendarOptions,
    interviewPlan,
    interviewPreferences,
    interviewSelectedCalendarId,
    interviewSettings,
    interviewSyncSummary,
    isGeneratingInterviewPlan,
    isInterviewCalendarListVisible,
    isLoadingInterviewCalendars,
    isSavingInterviewSettings,
    isSyncingInterviewCalendar,
    onAddToCalendar,
    onCycleWorkdayEnd,
    onCycleWorkdayStart,
    onDurationChange,
    onGenerate,
    onOpenCalendarPicker,
    onResetPreferences,
    onSelectInterviewCalendar,
    onWeekdayToggle,
    onWidenWindow,
    selectedInterviewCalendarOption,
    weekdayOptions,
  } = props;

  const isCalendarPickerDisabled =
    isSyncingInterviewCalendar || isGeneratingInterviewPlan || isSavingInterviewSettings || isLoadingInterviewCalendars;

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
            Best interview windows for next 30 days
          </Text>
          <Text className="text-[11px] mt-1" style={{ color: 'rgba(212,212,224,0.56)' }}>
            Duration {interviewPreferences.slotDurationMinutes}m | Workday {formatMinuteLabel(interviewPreferences.workdayStartMinute)}-{formatMinuteLabel(interviewPreferences.workdayEndMinute)}
          </Text>
          {interviewSettings?.autoFillConfirmedAt ? (
            <Text className="text-[10px] mt-1" style={{ color: 'rgba(212,212,224,0.5)' }}>
              Autofill active since {new Date(interviewSettings.autoFillConfirmedAt).toLocaleDateString()}
            </Text>
          ) : null}
          {interviewSettings?.filledUntilDateKey ? (
            <Text className="text-[10px] mt-1" style={{ color: 'rgba(212,212,224,0.5)' }}>
              Server horizon: {interviewSettings.filledUntilDateKey}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onGenerate}
          className="px-3 py-2 rounded-[10px]"
          style={{
            backgroundColor: 'rgba(160,140,255,0.16)',
            borderColor: 'rgba(160,140,255,0.34)',
            borderWidth: 1,
            opacity: isGeneratingInterviewPlan ? 0.8 : 1,
          }}
        >
          <Text className="text-[11px] font-semibold" style={{ color: 'rgba(221,214,255,0.98)' }}>
            {isGeneratingInterviewPlan ? 'Generating...' : 'Generate'}
          </Text>
        </Pressable>
      </View>

      <View className="mt-3">
        <Text className="text-[10px] tracking-[1.1px] font-semibold" style={{ color: 'rgba(212,212,224,0.56)' }}>
          SLOT DURATION
        </Text>
        <View className="flex-row mt-2">
          {durationOptions.map((duration) => {
            const active = interviewPreferences.slotDurationMinutes === duration;
            return (
              <Pressable
                key={duration}
                onPress={() => onDurationChange(duration)}
                className="px-2.5 py-1.5 rounded-[10px] mr-2"
                style={{
                  backgroundColor: active ? 'rgba(160,140,255,0.26)' : 'rgba(255,255,255,0.05)',
                  borderColor: active ? 'rgba(160,140,255,0.6)' : 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                }}
              >
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: active ? 'rgba(221,214,255,0.98)' : 'rgba(212,212,224,0.6)' }}
                >
                  {duration}m
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-3">
        <Text className="text-[10px] tracking-[1.1px] font-semibold" style={{ color: 'rgba(212,212,224,0.56)' }}>
          PREFERRED WEEKDAYS
        </Text>
        <View className="flex-row flex-wrap mt-2">
          {weekdayOptions.map((day) => {
            const active = interviewPreferences.allowedWeekdays.includes(day.value);
            return (
              <Pressable
                key={day.label}
                onPress={() => onWeekdayToggle(day.value)}
                className="px-2.5 py-1.5 rounded-[10px] mr-2 mb-2"
                style={{
                  backgroundColor: active ? 'rgba(160,140,255,0.22)' : 'rgba(255,255,255,0.05)',
                  borderColor: active ? 'rgba(160,140,255,0.54)' : 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                }}
              >
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: active ? 'rgba(221,214,255,0.98)' : 'rgba(212,212,224,0.58)' }}
                >
                  {day.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-1 flex-row items-center">
        <Pressable
          onPress={onCycleWorkdayStart}
          className="flex-1 px-3 py-2.5 rounded-[10px] mr-2"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          }}
        >
          <Text className="text-[10px] tracking-[1.1px] font-semibold mb-0.5" style={{ color: 'rgba(212,212,224,0.5)' }}>
            START
          </Text>
          <Text className="text-[12px] font-semibold" style={{ color: 'rgba(233,233,242,0.92)' }}>
            {formatMinuteLabel(interviewPreferences.workdayStartMinute)}
          </Text>
        </Pressable>
        <Pressable
          onPress={onCycleWorkdayEnd}
          className="flex-1 px-3 py-2.5 rounded-[10px]"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          }}
        >
          <Text className="text-[10px] tracking-[1.1px] font-semibold mb-0.5" style={{ color: 'rgba(212,212,224,0.5)' }}>
            END
          </Text>
          <Text className="text-[12px] font-semibold" style={{ color: 'rgba(233,233,242,0.92)' }}>
            {formatMinuteLabel(interviewPreferences.workdayEndMinute)}
          </Text>
        </Pressable>
      </View>

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
            <Text className="text-[10px] tracking-[1.1px] font-semibold mb-0.5" style={{ color: 'rgba(212,212,224,0.5)' }}>
              TARGET CALENDAR
            </Text>
            <Text className="text-[12px] font-semibold" numberOfLines={1} style={{ color: 'rgba(233,233,242,0.92)' }}>
              {selectedInterviewCalendarOption
                ? formatInterviewCalendarOptionLabel(selectedInterviewCalendarOption)
                : interviewSelectedCalendarId
                  ? 'Selected calendar'
                  : 'Auto (default writable calendar)'}
            </Text>
          </View>
          <Pressable
            onPress={onOpenCalendarPicker}
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

        {isInterviewCalendarListVisible ? (
          <View className="mt-2">
            <Pressable
              onPress={() => onSelectInterviewCalendar(null)}
              className="rounded-[9px] px-2.5 py-2 mb-2"
              style={{
                backgroundColor: !interviewSelectedCalendarId ? 'rgba(160,140,255,0.16)' : 'rgba(255,255,255,0.03)',
                borderColor: !interviewSelectedCalendarId ? 'rgba(160,140,255,0.5)' : 'rgba(255,255,255,0.1)',
                borderWidth: 1,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-semibold pr-2 flex-1" style={{ color: 'rgba(233,233,242,0.9)' }}>
                  Auto (default writable calendar)
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
                  onPress={() => onSelectInterviewCalendar(option.id)}
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

      <Pressable
        onPress={onAddToCalendar}
        className="mt-3 px-3 py-2.5 rounded-[10px] items-center"
        style={{
          backgroundColor: 'rgba(160,140,255,0.16)',
          borderColor: 'rgba(160,140,255,0.38)',
          borderWidth: 1,
          opacity: isSyncingInterviewCalendar ? 0.8 : 1,
        }}
      >
        <Text className="text-[12px] font-semibold" style={{ color: 'rgba(221,214,255,0.98)' }}>
          {isSyncingInterviewCalendar ? 'Syncing Calendar...' : 'Add to Calendar'}
        </Text>
      </Pressable>

      {interviewSyncSummary ? (
        <Text className="text-[11px] mt-2" style={{ color: 'rgba(212,212,224,0.56)' }}>
          {interviewSyncSummary}
        </Text>
      ) : null}

      {interviewPlan ? (
        interviewPlan.slots.length > 0 ? (
          <View className="mt-3">
            <Text className="text-[10px] tracking-[1.1px] font-semibold mb-2" style={{ color: 'rgba(212,212,224,0.56)' }}>
              TOP WINDOWS
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
                    {slot.score}%
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
              No slots passed threshold
            </Text>
            <Text className="text-[10px] mt-1" style={{ color: 'rgba(212,212,224,0.55)' }}>
              Broaden weekdays or widen your work window, then regenerate.
            </Text>
            <View className="flex-row mt-2">
              <Pressable
                onPress={onWidenWindow}
                className="px-2.5 py-1.5 rounded-[9px] mr-2"
                style={{
                  backgroundColor: 'rgba(160,140,255,0.2)',
                  borderColor: 'rgba(160,140,255,0.52)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[10px] font-semibold" style={{ color: 'rgba(221,214,255,0.98)' }}>
                  Widen Window
                </Text>
              </Pressable>
              <Pressable
                onPress={onResetPreferences}
                className="px-2.5 py-1.5 rounded-[9px]"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.14)',
                  borderWidth: 1,
                }}
              >
                <Text className="text-[10px] font-semibold" style={{ color: 'rgba(212,212,224,0.66)' }}>
                  Reset Defaults
                </Text>
              </Pressable>
            </View>
          </View>
        )
      ) : (
        <Text className="text-[11px] mt-3" style={{ color: 'rgba(212,212,224,0.54)' }}>
          Generate strategy to preview ranked interview windows.
        </Text>
      )}
    </View>
  );
}
