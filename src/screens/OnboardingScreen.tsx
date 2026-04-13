import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, Info, User } from 'lucide-react-native';
import { CosmicOnboardingDarkBackground } from '../components/backgrounds/CosmicOnboardingDarkBackground';
import { CosmicOnboardingLightBackground } from '../components/backgrounds/CosmicOnboardingLightBackground';
import { OnboardingWheel } from '../components/OnboardingWheel';
import { GlassDatePicker, GlassTimePicker } from '../components/GlassDateTimePicker';
import { useOnboardingForm } from '../hooks/useOnboardingForm';
import { useThemeMode } from '../theme/ThemeModeProvider';
import { useBrightnessAdaptation } from '../contexts/BrightnessAdaptationContext';
import type { BrightnessBoostChannels } from '../contexts/brightnessAdaptationCore';
import { adaptColorOpacity } from '../utils/brightnessAdaptation';
import type { AppScreenProps } from '../types/navigation';

const ONBOARDING_WHEEL_TUNING = {
  heightFactor: 0.42,
  minSize: 240,
  maxSize: 320,
  horizontalPadding: 48,
  wheelToFormGap: 12,
  cityKeyboardGapAndroidMin: 34,
  cityKeyboardGapAndroidMax: 84,
  cityKeyboardGapAndroidRatio: 0.18,
  cityKeyboardGapIos: 16,
  cityFocusMinLiftAndroidMin: 12,
  cityFocusMinLiftAndroidMax: 24,
  cityFocusMinLiftAndroidRatio: 0.05,
  cityFocusMinLiftIos: 6,
} as const;

const TOOLTIP_POPOVER_TUNING = {
  maxWidth: 260,
  minSideInset: 16,
  verticalGap: 10,
  arrowSize: 12,
  minArrowInset: 18,
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

type TooltipAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type OnboardingPalette = {
  fieldLabel: string;
  inputBg: string;
  inputBorder: string;
  inputBorderActive: string;
  icon: string;
  infoIcon: string;
  textPrimary: string;
  placeholder: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  checkboxBorder: string;
  checkboxFill: string;
  helperText: string;
  cityListBg: string;
  cityListBorder: string;
  cityListItemSeparator: string;
  cityListText: string;
  submitError: string;
};

const ONBOARDING_DARK_PALETTE: OnboardingPalette = {
  fieldLabel: 'rgba(212,212,224,0.45)',
  inputBg: 'rgba(255,255,255,0.03)',
  inputBorder: 'rgba(255,255,255,0.06)',
  inputBorderActive: 'rgba(201,168,76,0.3)',
  icon: 'rgba(201,168,76,0.6)',
  infoIcon: 'rgba(212,212,224,0.4)',
  textPrimary: 'rgba(212,212,224,0.9)',
  placeholder: 'rgba(212,212,224,0.35)',
  tooltipBg: 'rgba(22,20,28,0.98)',
  tooltipBorder: 'rgba(255,255,255,0.08)',
  tooltipText: 'rgba(212,212,224,0.7)',
  checkboxBorder: 'rgba(255,255,255,0.2)',
  checkboxFill: 'rgba(201,168,76,0.3)',
  helperText: 'rgba(212,212,224,0.3)',
  cityListBg: 'rgba(20,20,35,0.96)',
  cityListBorder: 'rgba(255,255,255,0.15)',
  cityListItemSeparator: 'rgba(255,255,255,0.05)',
  cityListText: 'rgba(212,212,224,0.85)',
  submitError: '#FF9FB4',
};

const ONBOARDING_LIGHT_PALETTE: OnboardingPalette = {
  fieldLabel: 'rgba(123,108,88,0.88)',
  inputBg: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(169,145,107,0.18)',
  inputBorderActive: 'rgba(181,139,60,0.34)',
  icon: 'rgba(181,139,60,0.9)',
  infoIcon: 'rgba(123,108,88,0.64)',
  textPrimary: 'rgba(64,55,45,0.95)',
  placeholder: 'rgba(133,116,94,0.7)',
  tooltipBg: 'rgba(250,245,236,0.98)',
  tooltipBorder: 'rgba(169,145,107,0.18)',
  tooltipText: 'rgba(94,79,59,0.92)',
  checkboxBorder: 'rgba(158,135,99,0.52)',
  checkboxFill: 'rgba(181,139,60,0.44)',
  helperText: 'rgba(112,97,77,0.82)',
  cityListBg: 'rgba(255,255,255,0.88)',
  cityListBorder: 'rgba(169,145,107,0.18)',
  cityListItemSeparator: 'rgba(169,145,107,0.14)',
  cityListText: 'rgba(64,55,45,0.94)',
  submitError: '#C65A74',
};

function buildOnboardingPalette(
  basePalette: OnboardingPalette,
  channels: BrightnessBoostChannels
): OnboardingPalette {
  const stableTooltipGlowMultiplier = Math.max(1, channels.glowOpacityMultiplier);
  const stableTooltipBorderMultiplier = Math.max(1, channels.borderOpacityMultiplier);

  return {
    fieldLabel: adaptColorOpacity(basePalette.fieldLabel, channels.textOpacityMultiplier),
    inputBg: adaptColorOpacity(basePalette.inputBg, channels.glowOpacityMultiplier),
    inputBorder: adaptColorOpacity(basePalette.inputBorder, channels.borderOpacityMultiplier),
    inputBorderActive: adaptColorOpacity(basePalette.inputBorderActive, channels.borderOpacityMultiplier),
    icon: adaptColorOpacity(basePalette.icon, channels.textOpacityMultiplier),
    infoIcon: adaptColorOpacity(basePalette.infoIcon, channels.textOpacityMultiplier),
    textPrimary: adaptColorOpacity(basePalette.textPrimary, channels.textOpacityMultiplier),
    placeholder: adaptColorOpacity(basePalette.placeholder, channels.textOpacityMultiplier),
    tooltipBg: adaptColorOpacity(basePalette.tooltipBg, stableTooltipGlowMultiplier),
    tooltipBorder: adaptColorOpacity(basePalette.tooltipBorder, stableTooltipBorderMultiplier),
    tooltipText: adaptColorOpacity(basePalette.tooltipText, channels.textOpacityMultiplier),
    checkboxBorder: adaptColorOpacity(basePalette.checkboxBorder, channels.borderOpacityMultiplier),
    checkboxFill: adaptColorOpacity(basePalette.checkboxFill, channels.glowOpacityMultiplier),
    helperText: adaptColorOpacity(basePalette.helperText, channels.textOpacityMultiplier),
    cityListBg: adaptColorOpacity(basePalette.cityListBg, channels.glowOpacityMultiplier),
    cityListBorder: adaptColorOpacity(basePalette.cityListBorder, channels.borderOpacityMultiplier),
    cityListItemSeparator: adaptColorOpacity(
      basePalette.cityListItemSeparator,
      channels.borderOpacityMultiplier
    ),
    cityListText: adaptColorOpacity(basePalette.cityListText, channels.textOpacityMultiplier),
    submitError: adaptColorOpacity(basePalette.submitError, channels.textOpacityMultiplier),
  };
}

export const OnboardingScreen = ({ navigation }: AppScreenProps<'Onboarding'>) => {
  const { theme, isLight } = useThemeMode();
  const { channels } = useBrightnessAdaptation();
  const palette = useMemo(
    () => buildOnboardingPalette(isLight ? ONBOARDING_LIGHT_PALETTE : ONBOARDING_DARK_PALETTE, channels),
    [channels, isLight]
  );
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const viewportHeight = Math.max(0, windowHeight - insets.top - insets.bottom);
  const contentMinHeight = Math.max(0, viewportHeight - 32);
  const mainBlockMinHeight = Math.max(0, contentMinHeight - 32);
  const contentWidth = Math.max(
    0,
    Math.min(windowWidth, 430) - ONBOARDING_WHEEL_TUNING.horizontalPadding
  );
  const widthLimitedMaxWheelSize = Math.floor((contentWidth * 280) / 300);
  const dynamicWheelHeight = Math.max(
    ONBOARDING_WHEEL_TUNING.minSize,
    Math.min(
      Math.round(viewportHeight * ONBOARDING_WHEEL_TUNING.heightFactor),
      ONBOARDING_WHEEL_TUNING.maxSize,
      widthLimitedMaxWheelSize
    )
  );

  const {
    name,
    birthDate,
    birthTime,
    cityQuery,
    cityResults,
    cityInputHeight,
    submitError,
    showDatePicker,
    showTimePicker,
    dateValue,
    timeValue,
    unknownTime,
    citySelected,
    collapseDateTime,
    isCityFocused,
    isNameValid,
    dateTimeAnim,
    pageEnter,
    wheelFilledCount,
    setShowDatePicker,
    setShowTimePicker,
    setCityInputHeight,
    handleNameChange,
    handleNameBlur,
    handleDateConfirm,
    handleTimeConfirm,
    handleUnknownTimeToggle,
    handleCityChange,
    handleCityFocus,
    handleCityBlur,
    handleCitySelect,
    handleSubmit,
  } = useOnboardingForm(navigation);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  const [cityLift, setCityLift] = useState(0);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [showBirthTimePopover, setShowBirthTimePopover] = useState(false);
  const [birthTimePopoverAnchor, setBirthTimePopoverAnchor] = useState<TooltipAnchor | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const cityFieldRef = useRef<View>(null);
  const birthTimeInfoRef = useRef<View>(null);

  const nameBorderColor =
    isNameFocused || isNameValid ? palette.inputBorderActive : palette.inputBorder;
  const dateBorderColor =
    showDatePicker || Boolean(birthDate) ? palette.inputBorderActive : palette.inputBorder;
  const timeBorderColor =
    showTimePicker || Boolean(birthTime) || unknownTime
      ? palette.inputBorderActive
      : palette.inputBorder;
  const cityBorderColor =
    isCityFocused || citySelected ? palette.inputBorderActive : palette.inputBorder;
  const birthTimePopoverWidth = Math.min(
    TOOLTIP_POPOVER_TUNING.maxWidth,
    Math.max(200, windowWidth - TOOLTIP_POPOVER_TUNING.minSideInset * 2)
  );
  const birthTimePopoverLeft = birthTimePopoverAnchor
    ? clamp(
        birthTimePopoverAnchor.x + birthTimePopoverAnchor.width / 2 - birthTimePopoverWidth / 2,
        TOOLTIP_POPOVER_TUNING.minSideInset,
        windowWidth - birthTimePopoverWidth - TOOLTIP_POPOVER_TUNING.minSideInset
      )
    : TOOLTIP_POPOVER_TUNING.minSideInset;
  const birthTimePopoverTop = birthTimePopoverAnchor
    ? Math.max(
        insets.top + TOOLTIP_POPOVER_TUNING.minSideInset,
        birthTimePopoverAnchor.y + birthTimePopoverAnchor.height + TOOLTIP_POPOVER_TUNING.verticalGap
      )
    : insets.top + 48;
  const birthTimePopoverArrowLeft = birthTimePopoverAnchor
    ? clamp(
        birthTimePopoverAnchor.x + birthTimePopoverAnchor.width / 2 - birthTimePopoverLeft - TOOLTIP_POPOVER_TUNING.arrowSize / 2,
        TOOLTIP_POPOVER_TUNING.minArrowInset,
        birthTimePopoverWidth - TOOLTIP_POPOVER_TUNING.minArrowInset - TOOLTIP_POPOVER_TUNING.arrowSize
      )
    : TOOLTIP_POPOVER_TUNING.minArrowInset;

  const closeBirthTimePopover = () => {
    setShowBirthTimePopover(false);
    setBirthTimePopoverAnchor(null);
  };

  const openBirthTimePopover = () => {
    birthTimeInfoRef.current?.measureInWindow((x, y, width, height) => {
      setBirthTimePopoverAnchor({ x, y, width, height });
      setShowBirthTimePopover(true);
    });
  };

  const handleBirthTimeInfoPress = () => {
    if (showBirthTimePopover) {
      closeBirthTimePopover();
      return;
    }
    openBirthTimePopover();
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
      setKeyboardTop(
        typeof event.endCoordinates?.screenY === 'number'
          ? event.endCoordinates.screenY
          : windowHeight - (event.endCoordinates?.height ?? 0)
      );
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardTop(null);
      setCityLift(0);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isCityFocused || keyboardHeight <= 0 || keyboardTop == null) return;

    const timeoutId = setTimeout(() => {
      cityFieldRef.current?.measureInWindow((_x, y, _width, height) => {
        const adaptiveKeyboardGap =
          Platform.OS === 'android'
            ? clamp(
                Math.round(keyboardHeight * ONBOARDING_WHEEL_TUNING.cityKeyboardGapAndroidRatio),
                ONBOARDING_WHEEL_TUNING.cityKeyboardGapAndroidMin,
                ONBOARDING_WHEEL_TUNING.cityKeyboardGapAndroidMax
              )
            : ONBOARDING_WHEEL_TUNING.cityKeyboardGapIos;
        const adaptiveMinLift =
          Platform.OS === 'android'
            ? clamp(
                Math.round(keyboardHeight * ONBOARDING_WHEEL_TUNING.cityFocusMinLiftAndroidRatio),
                ONBOARDING_WHEEL_TUNING.cityFocusMinLiftAndroidMin,
                ONBOARDING_WHEEL_TUNING.cityFocusMinLiftAndroidMax
              )
            : ONBOARDING_WHEEL_TUNING.cityFocusMinLiftIos;

        const desiredBottom = keyboardTop - adaptiveKeyboardGap;
        const overlap = y + height - desiredBottom;
        setCityLift(
          overlap > 0
            ? Math.max(overlap, adaptiveMinLift)
            : adaptiveMinLift
        );
      });
    }, 220);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isCityFocused, keyboardHeight, keyboardTop]);

  useEffect(() => {
    if (!isCityFocused) {
      setCityLift(0);
    }
  }, [isCityFocused]);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      >
        {isLight ? <CosmicOnboardingLightBackground /> : <CosmicOnboardingDarkBackground />}
      </View>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          enabled={Platform.OS === 'ios'}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            removeClippedSubviews={Platform.OS === 'android'}
            scrollEventThrottle={16}
          >
            <Animated.View
              style={{
                width: '100%',
                maxWidth: 430,
                alignSelf: 'center',
                opacity: pageEnter,
                minHeight: contentMinHeight,
                transform: [
                  {
                    translateY: pageEnter.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              }}
              className="px-6 pt-8"
            >
              <Animated.View
                style={{
                  minHeight: mainBlockMinHeight,
                  justifyContent: 'flex-start',
                }}
              >
                  <View style={{ marginBottom: ONBOARDING_WHEEL_TUNING.wheelToFormGap }}>
                    <OnboardingWheel
                      filledCount={wheelFilledCount}
                      onReveal={handleSubmit}
                      size={dynamicWheelHeight}
                      brightnessChannels={channels}
                    />
                  </View>

                  <View style={{ marginTop: 'auto' }}>
                    <View>
                      <Animated.View
                        pointerEvents={collapseDateTime ? 'none' : 'auto'}
                        style={[
                          {
                            opacity: dateTimeAnim,
                            transform: [
                              {
                                translateY: dateTimeAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-8, 0],
                                }),
                              },
                              {
                                scale: dateTimeAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.98, 1],
                                }),
                              },
                            ],
                          },
                          collapseDateTime && { maxHeight: 0, overflow: 'hidden', marginBottom: 0 },
                        ]}
                      >
                        <View
                          className="gap-4"
                          style={!collapseDateTime ? { marginBottom: 16 } : undefined}
                        >
                          <View>
                            <Text
                              className="text-[11px] uppercase tracking-[2px] mb-2 px-1"
                              style={{ color: palette.fieldLabel }}
                            >
                              Name
                            </Text>
                            <View
                              className="flex-row items-center px-4 py-3.5 rounded-[16px]"
                              style={{
                                backgroundColor: palette.inputBg,
                                borderColor: nameBorderColor,
                                borderWidth: 1,
                              }}
                            >
                              <User
                                size={16}
                                color={palette.icon}
                                style={{ marginRight: 10 }}
                              />
                              <TextInput
                                value={name}
                                onChangeText={handleNameChange}
                                placeholder="Your name"
                                placeholderTextColor={palette.placeholder}
                                className="flex-1 text-[15px]"
                                style={{ color: palette.textPrimary }}
                                autoCapitalize="words"
                                returnKeyType="next"
                                onFocus={() => setIsNameFocused(true)}
                                onBlur={() => {
                                  setIsNameFocused(false);
                                  handleNameBlur();
                                }}
                              />
                            </View>
                          </View>

                          <View>
                            <View className="flex-row items-start" style={{ gap: 12 }}>
                              <View style={{ flex: 1 }}>
                                <Text
                                  className="text-[11px] uppercase tracking-[2px] mb-2 px-1"
                                  style={{ color: palette.fieldLabel }}
                                >
                                  Date of Birth
                                </Text>
                                <Pressable onPress={() => setShowDatePicker(true)}>
                                  <View
                                    className="flex-row items-center px-4 py-3.5 rounded-[16px]"
                                    style={{
                                      backgroundColor: palette.inputBg,
                                      borderColor: dateBorderColor,
                                      borderWidth: 1,
                                    }}
                                  >
                                    <Calendar
                                      size={16}
                                      color={palette.icon}
                                      style={{ marginRight: 10 }}
                                    />
                                    <Text
                                      className="text-[15px]"
                                      style={{
                                        color: birthDate
                                          ? palette.textPrimary
                                          : palette.placeholder,
                                      }}
                                    >
                                      {birthDate || 'dd/mm/yyyy'}
                                    </Text>
                                  </View>
                                </Pressable>
                              </View>

                              <View style={{ flex: 1 }}>
                                <View className="flex-row items-center justify-between mb-2 px-1">
                                  <Text
                                    className="text-[11px] uppercase tracking-[2px]"
                                    style={{ color: palette.fieldLabel }}
                                  >
                                    Time of Birth
                                  </Text>
                                  <View ref={birthTimeInfoRef} collapsable={false}>
                                    <Pressable onPress={handleBirthTimeInfoPress}>
                                      <Info size={14} color={palette.infoIcon} />
                                    </Pressable>
                                  </View>
                                </View>
                                <Pressable onPress={() => !unknownTime && setShowTimePicker(true)}>
                                  <View
                                    className="flex-row items-center px-4 py-3.5 rounded-[16px]"
                                    style={{
                                      backgroundColor: palette.inputBg,
                                      borderColor: timeBorderColor,
                                      borderWidth: 1,
                                      opacity: unknownTime ? 0.5 : 1,
                                    }}
                                  >
                                    <Clock
                                      size={16}
                                      color={palette.icon}
                                      style={{ marginRight: 10 }}
                                    />
                                    <Text
                                      className="text-[15px]"
                                      style={{
                                        color: birthTime
                                          ? palette.textPrimary
                                          : palette.placeholder,
                                      }}
                                    >
                                      {birthTime || '--:--'}
                                    </Text>
                                  </View>
                                </Pressable>
                              </View>
                            </View>

                            <Pressable
                              className="flex-row items-center mt-2 px-1"
                              onPress={handleUnknownTimeToggle}
                            >
                              <View
                                className="w-4 h-4 rounded-[4px] mr-2"
                                style={{
                                  borderColor: palette.checkboxBorder,
                                  borderWidth: 1,
                                  backgroundColor: unknownTime
                                    ? palette.checkboxFill
                                    : 'transparent',
                                }}
                              />
                              <Text
                                className="text-[12px]"
                                style={{ color: palette.fieldLabel }}
                              >
                                I don't know my birth time
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      </Animated.View>

                      <View
                        ref={cityFieldRef}
                        style={{
                          zIndex: isCityFocused ? 60 : 10,
                          transform: [{ translateY: -cityLift }],
                        }}
                      >
                        <Text
                          className="text-[11px] uppercase tracking-[2px] mb-2 px-1"
                          style={{ color: palette.fieldLabel }}
                        >
                          Birth City
                        </Text>
                        <View
                          className="flex-row items-center px-4 py-3.5 rounded-[16px]"
                          style={{
                            backgroundColor: palette.inputBg,
                            borderColor: cityBorderColor,
                            borderWidth: 1,
                          }}
                          onLayout={(e) => setCityInputHeight(e.nativeEvent.layout.height)}
                        >
                          <MapPin
                            size={16}
                            color={palette.icon}
                            style={{ marginRight: 10 }}
                          />
                          <TextInput
                            value={cityQuery}
                            onChangeText={handleCityChange}
                            placeholder="e.g. New York"
                            placeholderTextColor={palette.placeholder}
                            className="flex-1 text-[15px]"
                            style={{ color: palette.textPrimary }}
                            onFocus={handleCityFocus}
                            onBlur={handleCityBlur}
                          />
                        </View>

                        {cityResults.length > 0 && (
                          <View
                            style={{
                              position: 'absolute',
                              bottom: cityInputHeight + 8,
                              left: 0,
                              right: 0,
                              zIndex: 1000,
                              elevation: 5,
                              backgroundColor: palette.cityListBg,
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: palette.cityListBorder,
                              maxHeight: 220,
                            }}
                          >
                            <ScrollView
                              keyboardShouldPersistTaps="handled"
                              nestedScrollEnabled
                              showsVerticalScrollIndicator
                            >
                              {cityResults.map((cityResult) => (
                                <Pressable
                                  key={cityResult.id}
                                  onPress={() => handleCitySelect(cityResult)}
                                  className="px-4 py-3"
                                  style={{ borderBottomColor: palette.cityListItemSeparator, borderBottomWidth: 1 }}
                                >
                                  <Text style={{ color: palette.cityListText }}>
                                    {cityResult.label}
                                  </Text>
                                </Pressable>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </View>

                    <Text
                      className="text-center text-[11px] mt-6"
                      style={{ color: palette.helperText }}
                    >
                      Your data is encrypted and used only for astrological calculations
                    </Text>
                    {submitError ? (
                      <Text className="text-center text-[12px] mt-2" style={{ color: palette.submitError }}>
                        {submitError}
                      </Text>
                    ) : null}
                  </View>
                </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {showBirthTimePopover ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 2000,
            elevation: 20,
          }}
        >
          <Pressable
            onPress={closeBirthTimePopover}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <View
              style={{
                position: 'absolute',
                top: birthTimePopoverTop,
                left: birthTimePopoverLeft,
                width: birthTimePopoverWidth,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -TOOLTIP_POPOVER_TUNING.arrowSize / 2,
                  left: birthTimePopoverArrowLeft,
                  width: TOOLTIP_POPOVER_TUNING.arrowSize,
                  height: TOOLTIP_POPOVER_TUNING.arrowSize,
                  backgroundColor: palette.tooltipBg,
                  borderLeftWidth: 1,
                  borderTopWidth: 1,
                  borderLeftColor: palette.tooltipBorder,
                  borderTopColor: palette.tooltipBorder,
                  transform: [{ rotate: '45deg' }],
                }}
              />
              <View
                className="px-3 py-2 rounded-[12px]"
                style={{
                  backgroundColor: palette.tooltipBg,
                  borderColor: palette.tooltipBorder,
                  borderWidth: 1,
                  shadowColor: '#000',
                  shadowOpacity: isLight ? 0.08 : 0.22,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 10,
                }}
              >
                <Text
                  className="text-[11px]"
                  style={{ color: palette.tooltipText }}
                >
                  Birth time determines your Ascendant and house placements, which shape career
                  insights.
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <GlassDatePicker
        visible={showDatePicker}
        initialDate={dateValue}
        onCancel={() => setShowDatePicker(false)}
        onConfirm={handleDateConfirm}
      />
      <GlassTimePicker
        visible={showTimePicker}
        initialTime={timeValue}
        onCancel={() => setShowTimePicker(false)}
        onConfirm={handleTimeConfirm}
      />
    </View>
  );
};
