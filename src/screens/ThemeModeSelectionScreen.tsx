import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Flame, SunMoon } from 'lucide-react-native';
import { CosmicOnboardingDarkBackground } from '../components/backgrounds/CosmicOnboardingDarkBackground';
import { CosmicOnboardingLightBackground } from '../components/backgrounds/CosmicOnboardingLightBackground';
import { BrandedPulseButton } from '../components/BrandedPulseButton';
import type { ThemeMode } from '../theme';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

type ThemeChoiceScreenProps = {
  onSelectMode: (mode: ThemeMode) => void;
};

type ThemeChoicePalette = {
  background: string;
  divider: string;
  orbFill: string;
  orbBorder: string;
  orbGlow: string;
  orbGlowRing: string;
  orbGlyph: string;
  orbDot: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardBadgeBg: string;
  cardBadgeBorder: string;
  cardBadgeIcon: string;
  cardTitle: string;
  cardMeta: string;
  cardDelta: string;
  cardTrend: string;
  cardSummary: string;
  buttonBg: string;
  buttonBorder: string;
  buttonText: string;
  buttonShadow: string;
  buttonHalo: string;
  description: string;
  centerCoinBg: string;
  centerCoinBorder: string;
  centerCoinIcon: string;
};

const AnimatedView = Animated.createAnimatedComponent(View);

const LIGHT_PANEL: ThemeChoicePalette = {
  background: '#EEE7DA',
  divider: 'rgba(175,145,102,0.26)',
  orbFill: '#F4DE77',
  orbBorder: 'rgba(205,170,88,0.22)',
  orbGlow: 'rgba(232,195,92,0.22)',
  orbGlowRing: 'rgba(232,195,92,0.5)',
  orbGlyph: '#E09737',
  orbDot: '#E5A247',
  cardBg: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(203,174,123,0.18)',
  cardShadow: 'rgba(178,146,88,0.12)',
  cardBadgeBg: 'rgba(247,223,125,0.12)',
  cardBadgeBorder: 'rgba(205,170,88,0.18)',
  cardBadgeIcon: '#D48F31',
  cardTitle: '#7F6544',
  cardMeta: '#9B856A',
  cardDelta: '#30271F',
  cardTrend: '#78D8C2',
  cardSummary: '#9B856A',
  buttonBg: 'rgba(255,255,255,0.08)',
  buttonBorder: 'rgba(205,170,88,0.3)',
  buttonText: '#C69A38',
  buttonShadow: 'rgba(196,156,62,0.18)',
  buttonHalo: 'rgba(205,170,88,0.16)',
  description: '#BB9B72',
  centerCoinBg: '#1B1C2D',
  centerCoinBorder: '#C9A84C',
  centerCoinIcon: '#C9A84C',
};

const DARK_PANEL: ThemeChoicePalette = {
  background: '#06060C',
  divider: 'rgba(255,255,255,0.08)',
  orbFill: 'rgba(201,168,76,0.08)',
  orbBorder: 'rgba(201,168,76,0.36)',
  orbGlow: 'rgba(201,168,76,0.34)',
  orbGlowRing: 'rgba(201,168,76,0.2)',
  orbGlyph: '#E9D26A',
  orbDot: '#E9D26A',
  cardBg: 'rgba(31,33,55,0.88)',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardShadow: 'rgba(5,6,12,0.42)',
  cardBadgeBg: 'rgba(201,168,76,0.16)',
  cardBadgeBorder: 'rgba(201,168,76,0.22)',
  cardBadgeIcon: '#D8BB5A',
  cardTitle: '#D9DDF0',
  cardMeta: '#9197B0',
  cardDelta: '#F2F4FB',
  cardTrend: '#7BE0A9',
  cardSummary: '#A5ABC3',
  buttonBg: '#2A2831',
  buttonBorder: 'rgba(201,168,76,0.62)',
  buttonText: '#E0C766',
  buttonShadow: 'rgba(201,168,76,0.2)',
  buttonHalo: 'rgba(201,168,76,0.16)',
  description: '#7B7F98',
  centerCoinBg: '#151627',
  centerCoinBorder: '#C9A84C',
  centerCoinIcon: '#C9A84C',
};

const ORBIT_DOTS = [
  { top: 18, left: 18, size: 5 },
  { top: 20, right: 20, size: 5 },
  { top: 34, left: 10, size: 4 },
  { top: 44, right: 14, size: 4 },
  { bottom: 18, left: 22, size: 5 },
] as const;
const NOOP = () => {};

function ThemeSunGlyph({
  color,
  size = 18,
  strokeWidth = 2.2,
}: {
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const glyphColor = color ?? '#C9A84C';
  const half = size / 2;
  const inner = size * 0.22;
  const rayOuter = size * 0.44;
  const rayInner = size * 0.33;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={half}
        cy={half}
        r={inner}
        fill="none"
        stroke={glyphColor}
        strokeWidth={strokeWidth}
      />
      <G stroke={glyphColor} strokeLinecap="round" strokeWidth={strokeWidth}>
        <Line x1={half} y1={half - rayOuter} x2={half} y2={half - rayInner} />
        <Line x1={half} y1={half + rayInner} x2={half} y2={half + rayOuter} />
        <Line x1={half - rayOuter} y1={half} x2={half - rayInner} y2={half} />
        <Line x1={half + rayInner} y1={half} x2={half + rayOuter} y2={half} />
        <Line
          x1={half - rayOuter * 0.7}
          y1={half - rayOuter * 0.7}
          x2={half - rayInner * 0.72}
          y2={half - rayInner * 0.72}
        />
        <Line
          x1={half + rayInner * 0.72}
          y1={half - rayInner * 0.72}
          x2={half + rayOuter * 0.7}
          y2={half - rayOuter * 0.7}
        />
        <Line
          x1={half - rayOuter * 0.7}
          y1={half + rayOuter * 0.7}
          x2={half - rayInner * 0.72}
          y2={half + rayInner * 0.72}
        />
        <Line
          x1={half + rayInner * 0.72}
          y1={half + rayInner * 0.72}
          x2={half + rayOuter * 0.7}
          y2={half + rayOuter * 0.7}
        />
      </G>
    </Svg>
  );
}

function ThemeMoonGlyph({
  color,
  size = 18,
  strokeWidth = 2.2,
}: {
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const glyphColor = color ?? '#C9A84C';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M15.5 2.8A8.8 8.8 0 1 0 21.2 15a6.6 6.6 0 1 1-5.7-12.2Z"
        fill="none"
        stroke={glyphColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <Path
        d="M17.8 5.3 18.5 7l1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7Z"
        fill="none"
        stroke={glyphColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

const ThemeOrbitMark = React.memo(function ThemeOrbitMark({
  animated = true,
  palette,
  pulseDriver,
  variant,
}: {
  animated?: boolean;
  palette: ThemeChoicePalette;
  pulseDriver?: Animated.Value;
  variant: 'light' | 'dark';
}) {
  const localPulseValue = useRef(new Animated.Value(0)).current;
  const pulseValue = animated ? (pulseDriver ?? localPulseValue) : localPulseValue;

  useEffect(() => {
    if (!animated || pulseDriver) {
      localPulseValue.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(localPulseValue, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.timing(localPulseValue, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  }, [animated, localPulseValue, pulseDriver, variant]);

  const glowScale = animated
    ? pulseValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.96, 1.08],
      })
    : 1;

  const glowOpacity = animated
    ? pulseValue.interpolate({
        inputRange: [0, 1],
        outputRange: variant === 'light' ? [0.34, 0.88] : [0.24, 0.72],
      })
    : variant === 'light'
      ? 0.68
      : 0.54;

  const orbScale = animated
    ? pulseValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.985, 1.025],
      })
    : 1;

  return (
    <View style={styles.orbShell}>
      <AnimatedView
        pointerEvents="none"
        style={[
          styles.orbGlowRing,
          {
            borderColor: palette.orbGlowRing,
            shadowColor: palette.orbGlow,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      <AnimatedView
        style={[
          styles.orbBase,
          {
            backgroundColor: palette.orbFill,
            borderColor: palette.orbBorder,
            shadowColor: palette.orbGlow,
            transform: [{ scale: orbScale }],
          },
        ]}
      >
        {ORBIT_DOTS.map((dot, index) => (
          <View
            key={`${variant}-dot-${index}`}
            style={[
              styles.orbDot,
              {
                backgroundColor: palette.orbDot,
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size / 2,
                top: 'top' in dot ? dot.top : undefined,
                bottom: 'bottom' in dot ? dot.bottom : undefined,
                left: 'left' in dot ? dot.left : undefined,
                right: 'right' in dot ? dot.right : undefined,
              },
            ]}
          />
        ))}
        {variant === 'light' ? (
          <ThemeSunGlyph color={palette.orbGlyph} size={19} strokeWidth={2.2} />
        ) : (
          <ThemeMoonGlyph color={palette.orbGlyph} size={19} strokeWidth={2.15} />
        )}
      </AnimatedView>
    </View>
  );
});
ThemeOrbitMark.displayName = 'ThemeOrbitMark';

const PreviewCard = React.memo(function PreviewCard({
  palette,
  width,
}: {
  palette: ThemeChoicePalette;
  width: number;
}) {
  return (
    <View
      style={[
        styles.previewCard,
        {
          width,
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
          shadowColor: palette.cardShadow,
        },
      ]}
    >
      <View style={styles.previewHeaderRow}>
        <View style={styles.previewHeadingWrap}>
          <View
            style={[
              styles.previewBadge,
              {
                backgroundColor: palette.cardBadgeBg,
                borderColor: palette.cardBadgeBorder,
              },
            ]}
          >
            <Flame size={11} color={palette.cardBadgeIcon} strokeWidth={2.2} />
          </View>

          <View style={styles.previewTitleStack}>
            <Text style={[styles.previewTitle, { color: palette.cardTitle }]}>Career Vibe</Text>
            <Text style={[styles.previewMeta, { color: palette.cardMeta }]}>Thu, Apr 4</Text>
          </View>
        </View>

        <View style={styles.previewTrendStack}>
          <Text style={[styles.previewDelta, { color: palette.cardDelta }]}>+15%</Text>
          <Text style={[styles.previewTrend, { color: palette.cardTrend }]}>Rising</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={[styles.previewSummary, { color: palette.cardSummary }]}>
        Mercury trines your natal Sun. Excellent for interviews and presentations.
      </Text>
    </View>
  );
});
PreviewCard.displayName = 'PreviewCard';

const ThemePanelBackdrop = React.memo(function ThemePanelBackdrop({
  palette,
  variant,
}: {
  palette: ThemeChoicePalette;
  variant: 'light' | 'dark';
}) {
  return (
    <>
      <View style={[styles.panelBase, { backgroundColor: palette.background }]} />
      {variant === 'light' ? (
        <CosmicOnboardingLightBackground showAccentLines={false} style={StyleSheet.absoluteFillObject} />
      ) : (
        <CosmicOnboardingDarkBackground showAccentLines={false} style={StyleSheet.absoluteFillObject} />
      )}
    </>
  );
});
ThemePanelBackdrop.displayName = 'ThemePanelBackdrop';

function ThemePanelContent({
  buttonAnimated = true,
  buttonIcon,
  buttonLabel,
  contentStyle,
  description,
  orbAnimated = true,
  onPress,
  palette,
  pulseDriver,
  previewWidth,
  variant,
}: {
  buttonAnimated?: boolean;
  buttonIcon: 'sun' | 'moon';
  buttonLabel: string;
  contentStyle?: any;
  description: string;
  orbAnimated?: boolean;
  onPress: () => void;
  palette: ThemeChoicePalette;
  pulseDriver?: Animated.Value;
  previewWidth: number;
  variant: 'light' | 'dark';
}) {
  return (
    <AnimatedView style={[styles.panelContent, contentStyle]}>
      <View style={styles.contentStack}>
        <ThemeOrbitMark animated={orbAnimated} palette={palette} pulseDriver={pulseDriver} variant={variant} />
        <PreviewCard palette={palette} width={previewWidth} />
        <View style={styles.panelBottom}>
          <BrandedPulseButton
            Icon={buttonIcon === 'sun' ? ThemeSunGlyph : ThemeMoonGlyph}
            animated={buttonAnimated}
            backgroundColor={palette.buttonBg}
            borderColor={palette.buttonBorder}
            haloColor={palette.buttonHalo}
            iconColor={palette.buttonText}
            label={buttonLabel}
            onPress={onPress}
            pulseDriver={pulseDriver}
            shadowColor={palette.buttonShadow}
            textColor={palette.buttonText}
          />
          <Text style={[styles.panelDescription, { color: palette.description }]}>{description}</Text>
        </View>
      </View>
    </AnimatedView>
  );
}

function ThemePanel({
  buttonAnimated = true,
  buttonIcon,
  buttonLabel,
  contentStyle,
  description,
  orbAnimated = true,
  onPress,
  palette,
  pulseDriver,
  previewWidth,
  variant,
}: {
  buttonAnimated?: boolean;
  buttonIcon: 'sun' | 'moon';
  buttonLabel: string;
  contentStyle?: any;
  description: string;
  orbAnimated?: boolean;
  onPress: () => void;
  palette: ThemeChoicePalette;
  pulseDriver?: Animated.Value;
  previewWidth: number;
  variant: 'light' | 'dark';
}) {
  return (
    <View style={styles.panel}>
      <ThemePanelBackdrop palette={palette} variant={variant} />
      <ThemePanelContent
        buttonAnimated={buttonAnimated}
        buttonIcon={buttonIcon}
        buttonLabel={buttonLabel}
        contentStyle={contentStyle}
        description={description}
        onPress={onPress}
        orbAnimated={orbAnimated}
        palette={palette}
        pulseDriver={pulseDriver}
        previewWidth={previewWidth}
        variant={variant}
      />
    </View>
  );
}

function ThemeSelectionOverlay({
  backdropStyle,
  buttonIcon,
  buttonLabel,
  contentSlotStyle,
  contentStyle,
  description,
  isActive,
  palette,
  previewWidth,
  rootStyle,
  variant,
}: {
  backdropStyle: any;
  buttonIcon: 'sun' | 'moon';
  buttonLabel: string;
  contentSlotStyle: any;
  contentStyle: any;
  description: string;
  isActive: boolean;
  palette: ThemeChoicePalette;
  previewWidth: number;
  rootStyle: any;
  variant: 'light' | 'dark';
}) {
  if (!isActive) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.selectionOverlayRoot, rootStyle]}>
      <AnimatedView
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        style={[styles.selectionOverlayBackdrop, backdropStyle]}
      >
        <ThemePanelBackdrop palette={palette} variant={variant} />
      </AnimatedView>

      <AnimatedView
        shouldRasterizeIOS
        pointerEvents="none"
        renderToHardwareTextureAndroid
        style={[styles.selectionOverlayContentSlot, contentSlotStyle]}
      >
        <ThemePanelContent
          buttonAnimated={false}
          buttonIcon={buttonIcon}
          buttonLabel={buttonLabel}
          contentStyle={contentStyle}
          description={description}
          onPress={NOOP}
          orbAnimated={false}
          palette={palette}
          previewWidth={previewWidth}
          variant={variant}
        />
      </AnimatedView>
    </View>
  );
}

export function ThemeModeSelectionScreen({ onSelectMode }: ThemeChoiceScreenProps) {
  const { width } = useWindowDimensions();
  const previewWidth = Math.max(144, Math.min(170, (width - 54) / 2));
  const chooserPulse = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;
  const selectionProgress = useRef(new Animated.Value(0)).current;
  const [selectedMode, setSelectedMode] = useState<ThemeMode | null>(null);

  useEffect(() => {
    if (selectedMode) {
      chooserPulse.stopAnimation();
      chooserPulse.setValue(0);
      return;
    }

    chooserPulse.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(chooserPulse, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.timing(chooserPulse, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [chooserPulse, selectedMode]);

  useEffect(() => {
    entrance.setValue(0);
    selectionProgress.setValue(0);
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      isInteraction: false,
      useNativeDriver: true,
    });

    animation.start();
    return () => {
      animation.stop();
    };
  }, [entrance, selectionProgress]);

  const handleSelectMode = (nextMode: ThemeMode) => {
    if (selectedMode) {
      return;
    }

    entrance.stopAnimation();
    entrance.setValue(1);
    selectionProgress.setValue(0);
    setSelectedMode(nextMode);

    const animation = Animated.timing(selectionProgress, {
      toValue: 1,
      duration: 520,
      easing: Easing.inOut(Easing.cubic),
      isInteraction: false,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        onSelectMode(nextMode);
        return;
      }

      selectionProgress.setValue(0);
      setSelectedMode(null);
    });
  };

  const entranceLeftTranslateX = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.55, 0],
  });

  const entranceRightTranslateX = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.55, 0],
  });

  const entranceOpacity = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const lightBaseContentOpacity =
    selectedMode === 'light'
      ? selectionProgress.interpolate({
          inputRange: [0, 0.02, 0.12, 1],
          outputRange: [1, 0.35, 0, 0],
        })
      : 1;

  const darkBaseContentOpacity =
    selectedMode === 'dark'
      ? selectionProgress.interpolate({
          inputRange: [0, 0.02, 0.12, 1],
          outputRange: [1, 0.35, 0, 0],
        })
      : 1;

  const leftPanelSelectionOpacity =
    selectedMode === 'dark'
      ? selectionProgress.interpolate({
          inputRange: [0, 0.26, 1],
          outputRange: [1, 0, 0],
        })
      : 1;

  const rightPanelSelectionOpacity =
    selectedMode === 'light'
      ? selectionProgress.interpolate({
          inputRange: [0, 0.26, 1],
          outputRange: [1, 0, 0],
        })
      : 1;

  const leftPanelStyle = {
    opacity:
      typeof leftPanelSelectionOpacity === 'number'
        ? entranceOpacity
        : Animated.multiply(entranceOpacity, leftPanelSelectionOpacity),
    transform: [
      {
        translateX: entranceLeftTranslateX,
      },
    ],
  };

  const rightPanelStyle = {
    opacity:
      typeof rightPanelSelectionOpacity === 'number'
        ? entranceOpacity
        : Animated.multiply(entranceOpacity, rightPanelSelectionOpacity),
    transform: [
      {
        translateX: entranceRightTranslateX,
      },
    ],
  };

  const centerCoinStyle = {
    opacity:
      selectedMode === null
        ? entrance.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [0, 0.12, 1],
          })
        : selectionProgress.interpolate({
            inputRange: [0, 0.12, 1],
            outputRange: [1, 0.1, 0],
          }),
    transform: [
      {
        scale:
          selectedMode === null
            ? entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [0.72, 1],
              })
            : selectionProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.8],
              }),
      },
    ],
  };

  const dividerStyle = {
    opacity:
      selectedMode === null
        ? entrance.interpolate({
            inputRange: [0, 0.72, 1],
            outputRange: [0, 0.18, 1],
          })
        : selectionProgress.interpolate({
            inputRange: [0, 0.12, 1],
            outputRange: [1, 0.08, 0],
          }),
  };

  const lightOverlayStyle = {
    opacity: selectedMode === 'light' ? 1 : 0,
    transform: [
      {
        translateX:
          selectedMode === 'light'
            ? selectionProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, width * 0.25],
              })
            : 0,
      },
      {
        scaleX:
          selectedMode === 'light'
            ? selectionProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2.02],
              })
            : 1,
      },
    ],
  };

  const darkOverlayStyle = {
    opacity: selectedMode === 'dark' ? 1 : 0,
    transform: [
      {
        translateX:
          selectedMode === 'dark'
            ? selectionProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -width * 0.25],
              })
            : 0,
      },
      {
        scaleX:
          selectedMode === 'dark'
            ? selectionProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2.02],
              })
            : 1,
      },
    ],
  };

  const lightOverlayContentStyle = {
    opacity:
      selectedMode === 'light'
        ? selectionProgress.interpolate({
            inputRange: [0, 0.28, 0.78, 1],
            outputRange: [1, 0.72, 0.08, 0],
          })
        : 0,
  };

  const darkOverlayContentStyle = {
    opacity:
      selectedMode === 'dark'
        ? selectionProgress.interpolate({
            inputRange: [0, 0.28, 0.78, 1],
            outputRange: [1, 0.72, 0.08, 0],
          })
        : 0,
  };

  const lightOverlayRootStyle = {
    zIndex: selectedMode === 'light' ? 6 : 0,
  };

  const darkOverlayRootStyle = {
    zIndex: selectedMode === 'dark' ? 6 : 0,
  };

  return (
    <View style={styles.root}>
      <View pointerEvents={selectedMode ? 'none' : 'auto'} style={styles.splitLayout}>
        <AnimatedView style={[styles.panelSlot, leftPanelStyle]}>
          <ThemePanel
            buttonIcon="sun"
            buttonLabel="Light Theme"
          contentStyle={{ opacity: lightBaseContentOpacity }}
          description="Warm ivory tones for daytime use"
          onPress={() => handleSelectMode('light')}
          palette={LIGHT_PANEL}
          pulseDriver={chooserPulse}
          previewWidth={previewWidth}
          variant="light"
        />
        </AnimatedView>

        <AnimatedView style={[styles.centerDivider, { backgroundColor: LIGHT_PANEL.divider }, dividerStyle]} />

        <AnimatedView style={[styles.panelSlot, rightPanelStyle]}>
          <ThemePanel
            buttonIcon="moon"
            buttonLabel="Dark Theme"
          contentStyle={{ opacity: darkBaseContentOpacity }}
          description="Deep cosmic tones for immersion"
          onPress={() => handleSelectMode('dark')}
          palette={DARK_PANEL}
          pulseDriver={chooserPulse}
          previewWidth={previewWidth}
          variant="dark"
        />
        </AnimatedView>

        <AnimatedView style={[styles.centerCoinWrap, centerCoinStyle]} pointerEvents="none">
          <View style={styles.centerCoin}>
            <SunMoon size={13} color={LIGHT_PANEL.centerCoinIcon} strokeWidth={2.2} />
          </View>
        </AnimatedView>

        <ThemeSelectionOverlay
          backdropStyle={[styles.lightOverlayPosition, lightOverlayStyle]}
          buttonIcon="sun"
          buttonLabel="Light Theme"
          contentSlotStyle={styles.lightOverlayPosition}
          contentStyle={lightOverlayContentStyle}
          description="Warm ivory tones for daytime use"
          isActive={selectedMode === 'light'}
          palette={LIGHT_PANEL}
          previewWidth={previewWidth}
          rootStyle={lightOverlayRootStyle}
          variant="light"
        />
        <ThemeSelectionOverlay
          backdropStyle={[styles.darkOverlayPosition, darkOverlayStyle]}
          buttonIcon="moon"
          buttonLabel="Dark Theme"
          contentSlotStyle={styles.darkOverlayPosition}
          contentStyle={darkOverlayContentStyle}
          description="Deep cosmic tones for immersion"
          isActive={selectedMode === 'dark'}
          palette={DARK_PANEL}
          previewWidth={previewWidth}
          rootStyle={darkOverlayRootStyle}
          variant="dark"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LIGHT_PANEL.background,
  },
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  panelSlot: {
    flex: 1,
  },
  panel: {
    flex: 1,
    overflow: 'hidden',
  },
  panelBase: {
    ...StyleSheet.absoluteFillObject,
  },
  panelContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  contentStack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbShell: {
    width: 86,
    height: 86,
    marginBottom: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlowRing: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 6,
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  orbBase: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  orbDot: {
    position: 'absolute',
  },
  previewCard: {
    minHeight: 92,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 10,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewHeadingWrap: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: 8,
  },
  previewBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    marginTop: 1,
  },
  previewTitleStack: {
    flex: 1,
    minWidth: 0,
  },
  previewTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  previewMeta: {
    marginTop: 2,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '500',
  },
  previewTrendStack: {
    alignItems: 'flex-end',
    marginLeft: 6,
  },
  previewDelta: {
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  previewTrend: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
  },
  previewSummary: {
    marginTop: 10,
    fontSize: 10,
    lineHeight: 14,
  },
  panelBottom: {
    width: '100%',
    alignItems: 'center',
    marginTop: 26,
  },
  panelDescription: {
    marginTop: 12,
    maxWidth: 150,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  centerDivider: {
    width: 1,
  },
  centerCoinWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -21,
    marginTop: -21,
  },
  centerCoin: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: LIGHT_PANEL.centerCoinBg,
    borderWidth: 2,
    borderColor: LIGHT_PANEL.centerCoinBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  selectionOverlayRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  selectionOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    overflow: 'hidden',
  },
  selectionOverlayContentSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
  },
  lightOverlayPosition: {
    left: 0,
  },
  darkOverlayPosition: {
    right: 0,
  },
});
