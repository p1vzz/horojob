import React, { useEffect, useRef, useState } from 'react';
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
import { OnboardingWheel } from '../components/OnboardingWheel';
import { GlassDatePicker, GlassTimePicker } from '../components/GlassDateTimePicker';
import { useOnboardingForm } from '../hooks/useOnboardingForm';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useThemeMode } from '../theme/ThemeModeProvider';

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

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

type OnboardingPalette = {
  glowTopStart: string;
  glowTopMid: string;
  glowBottomStart: string;
  glowBottomMid: string;
  mist0: string;
  mist1: string;
  mist2: string;
  mist3: string;
  greenLineMidA: string;
  greenLineMidB: string;
  greenLineSecondary: string;
  introTitle: string;
  introSubtitle: string;
  fieldLabel: string;
  inputBg: string;
  inputBorder: string;
  inputBorderActive: string;
  icon: string;
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
  glowTopStart: 'rgba(90,58,204,0.26)',
  glowTopMid: 'rgba(90,58,204,0.08)',
  glowBottomStart: 'rgba(201,168,76,0.18)',
  glowBottomMid: 'rgba(201,168,76,0.05)',
  mist0: 'rgba(255,255,255,0.008)',
  mist1: 'rgba(255,255,255,0.012)',
  mist2: 'rgba(255,255,255,0.03)',
  mist3: 'rgba(255,255,255,0.014)',
  greenLineMidA: 'rgba(113,163,103,0.16)',
  greenLineMidB: 'rgba(162,190,114,0.11)',
  greenLineSecondary: 'rgba(109,159,100,0.1)',
  introTitle: '#C9A84C',
  introSubtitle: 'rgba(212,212,224,0.6)',
  fieldLabel: 'rgba(212,212,224,0.45)',
  inputBg: 'rgba(255,255,255,0.03)',
  inputBorder: 'rgba(255,255,255,0.06)',
  inputBorderActive: 'rgba(201,168,76,0.3)',
  icon: 'rgba(201,168,76,0.6)',
  textPrimary: 'rgba(212,212,224,0.9)',
  placeholder: 'rgba(212,212,224,0.35)',
  tooltipBg: 'rgba(14,14,30,0.9)',
  tooltipBorder: 'rgba(255,255,255,0.08)',
  tooltipText: 'rgba(212,212,224,0.7)',
  checkboxBorder: 'rgba(255,255,255,0.2)',
  checkboxFill: 'rgba(201,168,76,0.3)',
  helperText: 'rgba(212,212,224,0.5)',
  cityListBg: 'rgb(20, 20, 35)',
  cityListBorder: 'rgba(255,255,255,0.15)',
  cityListItemSeparator: 'rgba(255,255,255,0.05)',
  cityListText: 'rgba(212,212,224,0.85)',
  submitError: '#FF9FB4',
};

const ONBOARDING_LIGHT_PALETTE: OnboardingPalette = {
  glowTopStart: 'rgba(125,98,220,0.16)',
  glowTopMid: 'rgba(125,98,220,0.05)',
  glowBottomStart: 'rgba(190,154,84,0.16)',
  glowBottomMid: 'rgba(190,154,84,0.04)',
  mist0: 'rgba(255,255,255,0.05)',
  mist1: 'rgba(255,255,255,0.07)',
  mist2: 'rgba(255,255,255,0.12)',
  mist3: 'rgba(255,255,255,0.08)',
  greenLineMidA: 'rgba(110,148,91,0.2)',
  greenLineMidB: 'rgba(151,176,106,0.14)',
  greenLineSecondary: 'rgba(104,141,86,0.14)',
  introTitle: '#B86A2D',
  introSubtitle: 'rgba(108,93,76,0.86)',
  fieldLabel: 'rgba(123,108,88,0.88)',
  inputBg: 'rgba(255,255,255,0.82)',
  inputBorder: 'rgba(169,145,107,0.26)',
  inputBorderActive: 'rgba(181,139,60,0.46)',
  icon: 'rgba(181,139,60,0.9)',
  textPrimary: 'rgba(64,55,45,0.95)',
  placeholder: 'rgba(133,116,94,0.7)',
  tooltipBg: 'rgba(255,255,255,0.95)',
  tooltipBorder: 'rgba(169,145,107,0.28)',
  tooltipText: 'rgba(94,79,59,0.92)',
  checkboxBorder: 'rgba(158,135,99,0.52)',
  checkboxFill: 'rgba(181,139,60,0.44)',
  helperText: 'rgba(112,97,77,0.82)',
  cityListBg: 'rgba(255,255,255,0.98)',
  cityListBorder: 'rgba(169,145,107,0.32)',
  cityListItemSeparator: 'rgba(169,145,107,0.14)',
  cityListText: 'rgba(64,55,45,0.94)',
  submitError: '#C65A74',
};

export const OnboardingScreen = ({ navigation }: { navigation: any }) => {
  const { theme, isLight } = useThemeMode();
  const palette = isLight ? ONBOARDING_LIGHT_PALETTE : ONBOARDING_DARK_PALETTE;

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
  const centerRingRadius = Math.max(windowWidth, windowHeight) * 0.42;
  const centerRingCx = windowWidth * 0.25;
  const centerRingCy = windowHeight * 0.77;

  const {
    name,
    birthDate,
    birthTime,
    city,
    cityQuery,
    cityResults,
    cityInputHeight,
    submitError,
    showDatePicker,
    showTimePicker,
    dateValue,
    timeValue,
    unknownTime,
    showTooltip,
    collapseDateTime,
    isCityFocused,
    dateTimeAnim,
    pageEnter,
    wheelFilledCount,
    setShowDatePicker,
    setShowTimePicker,
    setCityInputHeight,
    toggleTooltip,
    handleNameChange,
    handleDateConfirm,
    handleTimeConfirm,
    handleUnknownTimeToggle,
    handleCityChange,
    handleCityFocus,
    handleCityBlur,
    handleCitySelect,
    handleSubmit,
  } = useOnboardingForm(navigation);
  const [showMainContent, setShowMainContent] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  const [cityLift, setCityLift] = useState(0);
  const introTextOpacity = useRef(new Animated.Value(0)).current;
  const introTextScale = useRef(new Animated.Value(1)).current;
  const mainContentProgress = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const cityFieldRef = useRef<View>(null);

  useEffect(() => {
    introTextOpacity.setValue(0);
    introTextScale.setValue(1);
    const introSequence = Animated.sequence([
      Animated.timing(introTextOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.delay(4000),
      Animated.sequence([
        Animated.timing(introTextScale, {
          toValue: 1.12,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(introTextScale, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(introTextOpacity, {
        toValue: 0,
        duration: 340,
        useNativeDriver: true,
      }),
    ]);

    introSequence.start(({ finished }) => {
      if (!finished) return;
      setShowMainContent(true);
      Animated.timing(mainContentProgress, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      introSequence.stop();
    };
  }, [introTextOpacity, introTextScale, mainContentProgress]);

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
        <Svg height={windowHeight} width={windowWidth}>
          <Defs>
            <RadialGradient
              id="onboardingBgGlowTop"
              cx="38%"
              cy="-8%"
              rx="72%"
              ry="54%"
              fx="38%"
              fy="-8%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor={palette.glowTopStart} stopOpacity={1} />
              <Stop offset="54%" stopColor={palette.glowTopMid} stopOpacity={1} />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id="onboardingBgGlowBottom"
              cx="84%"
              cy="108%"
              rx="70%"
              ry="52%"
              fx="84%"
              fy="108%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor={palette.glowBottomStart} stopOpacity={1} />
              <Stop offset="58%" stopColor={palette.glowBottomMid} stopOpacity={1} />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id="onboardingBgMistCenter"
              cx={centerRingCx}
              cy={centerRingCy}
              r={centerRingRadius}
              fx={centerRingCx}
              fy={centerRingCy}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor={palette.mist0} stopOpacity={1} />
              <Stop offset="18%" stopColor={palette.mist1} stopOpacity={1} />
              <Stop offset="48%" stopColor={palette.mist2} stopOpacity={1} />
              <Stop offset="74%" stopColor={palette.mist3} stopOpacity={1} />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient
              id="onboardingBgGreenLine"
              x1={windowWidth * 0.08}
              y1={windowHeight * 0.94}
              x2={windowWidth * 1.08}
              y2={windowHeight * 0.84}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="rgba(113,163,103,0)" stopOpacity="0" />
              <Stop offset="42%" stopColor={palette.greenLineMidA} stopOpacity={1} />
              <Stop offset="72%" stopColor={palette.greenLineMidB} stopOpacity={1} />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <Rect x="0" y="0" width={windowWidth} height={windowHeight} fill="url(#onboardingBgGlowTop)" />
          <Rect x="0" y="0" width={windowWidth} height={windowHeight} fill="url(#onboardingBgGlowBottom)" />
          <Circle
            cx={centerRingCx}
            cy={centerRingCy}
            r={centerRingRadius}
            fill="url(#onboardingBgMistCenter)"
          />
          <Path
            d={`M ${windowWidth * 0.08} ${windowHeight * 0.93} C ${windowWidth * 0.34} ${windowHeight * 0.82}, ${windowWidth * 0.68} ${windowHeight * 1.02}, ${windowWidth * 1.08} ${windowHeight * 0.86}`}
            fill="none"
            stroke="url(#onboardingBgGreenLine)"
            strokeWidth={1.4}
          />
          <Path
            d={`M ${windowWidth * 0.2} ${windowHeight * 0.98} C ${windowWidth * 0.48} ${windowHeight * 0.88}, ${windowWidth * 0.8} ${windowHeight * 1.04}, ${windowWidth * 1.12} ${windowHeight * 0.9}`}
            fill="none"
            stroke={palette.greenLineSecondary}
            strokeWidth={1}
          />
        </Svg>
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
              {!showMainContent ? (
                <Animated.View
                  className="pb-8"
                  style={{
                    opacity: introTextOpacity,
                    minHeight: mainBlockMinHeight,
                    justifyContent: 'center',
                    transform: [{ scale: introTextScale }],
                  }}
                >
                  <Text
                    className="text-center text-[20px] font-semibold mb-2"
                    style={{ color: palette.introTitle }}
                  >
                    Unlock Your Career Map
                  </Text>
                  <Text
                    className="text-center text-[13px]"
                    style={{ color: palette.introSubtitle }}
                  >
                    Enter your birth details to reveal your cosmic career profile
                  </Text>
                </Animated.View>
              ) : (
                <Animated.View
                  style={{
                    opacity: mainContentProgress,
                    minHeight: mainBlockMinHeight,
                    justifyContent: 'flex-start',
                    transform: [
                      {
                        translateY: mainContentProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View style={{ marginBottom: ONBOARDING_WHEEL_TUNING.wheelToFormGap }}>
                    <OnboardingWheel
                      filledCount={wheelFilledCount}
                      onReveal={handleSubmit}
                      size={dynamicWheelHeight}
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
                                borderColor: name.trim()
                                  ? palette.inputBorderActive
                                  : palette.inputBorder,
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
                                      borderColor: birthDate
                                        ? palette.inputBorderActive
                                        : palette.inputBorder,
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
                                  <Pressable onPress={toggleTooltip}>
                                    <Info size={14} color={palette.helperText} />
                                  </Pressable>
                                </View>
                                {showTooltip && (
                                  <View
                                    className="mb-2 px-3 py-2 rounded-[12px]"
                                    style={{
                                      backgroundColor: palette.tooltipBg,
                                      borderColor: palette.tooltipBorder,
                                      borderWidth: 1,
                                    }}
                                  >
                                    <Text
                                      className="text-[11px]"
                                      style={{ color: palette.tooltipText }}
                                    >
                                      Birth time determines your Ascendant and house placements, which
                                      shape career insights.
                                    </Text>
                                  </View>
                                )}
                                <Pressable onPress={() => !unknownTime && setShowTimePicker(true)}>
                                  <View
                                    className="flex-row items-center px-4 py-3.5 rounded-[16px]"
                                    style={{
                                      backgroundColor: palette.inputBg,
                                      borderColor:
                                        birthTime || unknownTime
                                          ? palette.inputBorderActive
                                          : palette.inputBorder,
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
                                style={{ color: palette.helperText }}
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
                            borderColor: city ? palette.inputBorderActive : palette.inputBorder,
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
                                  style={{ borderBottomWidth: 1, borderBottomColor: palette.cityListItemSeparator }}
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
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
