import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Crown, ArrowRight, TrendingUp, AlertTriangle, Sparkles, Orbit, ChevronRight } from 'lucide-react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigationProp } from '../types/navigation';
import { ApiError, ensureAuthSession } from '../services/authSession';
import { fetchFullNatalCareerAnalysis } from '../services/astrologyApi';
import { useThemeMode } from '../theme/ThemeModeProvider';
import {
  FALLBACK_DEEP_DIVE_SNAPSHOT,
  formatDeepDivePercent,
  toDeepDiveSnapshot,
  type DeepDiveSnapshot,
} from './deepDiveTileCore';
import { DEEP_DIVE_BLUR_POSITIONS } from './deepDiveTileVisuals';

const CARD_HEIGHT = 180;

const LockedDeepDiveCard = ({ onPress, isLight }: { onPress: () => void; isLight: boolean }) => (
  <TouchableOpacity
    activeOpacity={0.94}
    onPress={onPress}
    style={{
      height: CARD_HEIGHT,
      borderRadius: 32,
      overflow: 'hidden',
      backgroundColor: isLight ? 'rgba(255,252,246,0.96)' : '#0C0C14',
      borderColor: isLight ? 'rgba(180,151,103,0.24)' : 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <View style={{ position: 'absolute', width: 200, height: 200 }}>
      <Svg width="200" height="200">
        <Defs>
          <RadialGradient id="purpleGlowDeepDive" cx="100" cy="100" r="100" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#6E44FF" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#6E44FF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="200" height="200" fill="url(#purpleGlowDeepDive)" />
      </Svg>
    </View>

      <View style={{ opacity: 0.3 }} className="absolute items-center justify-center">
        <View className="w-[140px] h-[140px] justify-center items-center">
        {DEEP_DIVE_BLUR_POSITIONS.map((p, i) => (
          <Text
            key={i}
            style={{
              position: 'absolute',
              color: 'rgba(201,168,76,0.5)',
              fontSize: 10,
              transform: [{ translateX: p.x }, { translateY: p.y }],
            }}
          >
            {p.s}
          </Text>
        ))}
        <Svg height="140" width="140" viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="42" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
          <Circle cx="50" cy="50" r="32" fill="none" stroke="rgba(110,68,255,0.2)" strokeWidth="0.3" />
        </Svg>
      </View>
    </View>

    <LinearGradient
      colors={isLight ? ['rgba(255,255,255,0.45)', 'rgba(247,240,229,0.9)'] : ['transparent', 'rgba(12, 12, 20, 0.8)']}
      style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <Text className="text-[18px] font-bold mb-6 tracking-tight" style={{ color: isLight ? 'rgba(64,55,45,0.92)' : 'rgba(255,255,255,0.9)' }}>
        Full Career Analysis
      </Text>

      <View className="w-full max-w-[220px]" style={{ borderRadius: 26, overflow: 'hidden' }}>
        <LinearGradient
          colors={['#D4B45B', '#C9A84C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="flex-row items-center justify-center py-3"
          style={{
            borderRadius: 26,
            shadowColor: '#C9A84C',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 8,
          }}
        >
          <Crown size={16} color="#000" style={{ marginRight: 8 }} />
          <Text className="text-[15px] font-black text-black">Open Analysis</Text>
          <ArrowRight size={16} color="#000" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

export const DeepDiveTile = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { isLight } = useThemeMode();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [snapshot, setSnapshot] = useState<DeepDiveSnapshot>(FALLBACK_DEEP_DIVE_SNAPSHOT);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const session = await ensureAuthSession();
        const premium = session.user.subscriptionTier === 'premium';
        if (!mounted) return;
        setIsPremium(premium);
        if (!premium) return;

        const payload = await fetchFullNatalCareerAnalysis();
        if (!mounted) return;
        setNeedsProfileSetup(false);
        setSnapshot(toDeepDiveSnapshot(payload.analysis));
      } catch (error) {
        if (!mounted) return;
        if (error instanceof ApiError && error.status === 403) {
          setIsPremium(false);
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setNeedsProfileSetup(true);
          return;
        }
        setSnapshot(FALLBACK_DEEP_DIVE_SNAPSHOT);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenAnalysis = () => navigation.navigate('FullNatalCareerAnalysis');

  return (
    <View className="px-5 py-2 pb-12">
      <View className="flex-row justify-between items-center mb-3 px-1">
        <Text
          className="text-[11px] tracking-[2.5px] font-black uppercase"
          style={{ color: isLight ? 'rgba(126,114,98,0.62)' : 'rgba(255,255,255,0.4)' }}
        >
          Deep Dive Analysis
        </Text>
        {isPremium ? (
          <Pressable onPress={handleOpenAnalysis} className="flex-row items-center">
            <Text className="text-[11px] font-semibold" style={{ color: 'rgba(201,168,76,0.92)' }}>
              Full Report
            </Text>
            <ChevronRight size={13} color="rgba(201,168,76,0.92)" />
          </Pressable>
        ) : (
          <View className="flex-row items-center bg-[#C9A84C]/10 px-2 py-0.5 rounded-full border border-[#C9A84C]/20">
            <Crown size={10} color="#C9A84C" />
            <Text className="text-[10px] font-bold ml-1 text-[#C9A84C]">PRO</Text>
          </View>
        )}
      </View>

      {isPremium ? needsProfileSetup ? (
        <View
          className="rounded-[20px] p-4"
          style={{
            borderColor: isLight ? 'rgba(180,151,103,0.26)' : 'rgba(201,168,76,0.2)',
            borderWidth: 1,
            backgroundColor: isLight ? 'rgba(255,252,246,0.96)' : 'rgba(11,11,18,0.95)',
          }}
        >
          <LinearGradient
            colors={
              isLight
                ? ['rgba(124,92,255,0.08)', 'rgba(201,168,76,0.08)', 'rgba(255,255,255,0.24)']
                : ['rgba(90,58,204,0.08)', 'rgba(201,168,76,0.06)', 'rgba(10,10,20,0.06)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', inset: 0 }}
          />
          <View
            className="rounded-[14px] px-3 py-3"
            style={{
              backgroundColor: isLight ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.1)',
              borderColor: isLight ? 'rgba(170,141,92,0.34)' : 'rgba(201,168,76,0.28)',
              borderWidth: 1,
            }}
          >
            <View className="flex-row items-center mb-1">
              <Sparkles size={14} color="#E1C066" />
              <Text className="text-[22px] font-semibold ml-2" style={{ color: isLight ? 'rgba(85,67,34,0.92)' : 'rgba(240,234,214,0.92)' }}>
                Blueprint Summary
              </Text>
            </View>
            <Text className="text-[12px] leading-[18px]" style={{ color: isLight ? 'rgba(95,77,45,0.86)' : 'rgba(225,215,186,0.82)' }}>
              Complete your birth profile and natal chart to generate your full career blueprint summary.
            </Text>
          </View>

          <View className="flex-row mt-3">
            <Pressable
              onPress={() => navigation.navigate('NatalChart')}
              className="flex-1 rounded-[12px] py-2.5 mr-2 items-center flex-row justify-center"
              style={{
                backgroundColor: isLight ? 'rgba(92,70,212,0.12)' : 'rgba(92,70,212,0.16)',
                borderColor: isLight ? 'rgba(92,70,212,0.28)' : 'rgba(92,70,212,0.36)',
                borderWidth: 1,
              }}
            >
              <Orbit size={13} color="#8C7CFF" />
              <Text className="text-[12px] font-semibold ml-1.5" style={{ color: isLight ? 'rgba(74,61,128,0.94)' : 'rgba(209,201,255,0.94)' }}>
                Natal Chart
              </Text>
            </Pressable>

            <Pressable
              onPress={handleOpenAnalysis}
              className="flex-1 rounded-[12px] py-2.5 items-center flex-row justify-center"
              style={{
                backgroundColor: isLight ? 'rgba(201,168,76,0.14)' : 'rgba(201,168,76,0.2)',
                borderColor: isLight ? 'rgba(170,141,92,0.34)' : 'rgba(201,168,76,0.38)',
                borderWidth: 1,
              }}
            >
              <Sparkles size={13} color="#E1C066" />
              <Text className="text-[12px] font-semibold ml-1.5" style={{ color: isLight ? 'rgba(102,79,39,0.96)' : 'rgba(240,225,178,0.96)' }}>
                Full Report
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View
          className="rounded-[20px] p-4"
          style={{
            borderColor: isLight ? 'rgba(180,151,103,0.26)' : 'rgba(201,168,76,0.2)',
            borderWidth: 1,
            backgroundColor: isLight ? 'rgba(255,252,246,0.96)' : 'rgba(11,11,18,0.95)',
          }}
        >
          <LinearGradient
            colors={
              isLight
                ? ['rgba(124,92,255,0.08)', 'rgba(201,168,76,0.08)', 'rgba(255,255,255,0.24)']
                : ['rgba(90,58,204,0.08)', 'rgba(201,168,76,0.06)', 'rgba(10,10,20,0.06)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', inset: 0 }}
          />

          <View className="flex-row">
            <View
              className="flex-1 rounded-[14px] p-3 mr-2"
              style={{
                backgroundColor: 'rgba(56,204,136,0.1)',
                borderColor: 'rgba(56,204,136,0.28)',
                borderWidth: 1,
              }}
            >
              <TrendingUp size={15} color="#38CC88" />
              <Text className="text-[30px] font-bold mt-2" style={{ color: '#38CC88' }}>
                {formatDeepDivePercent(snapshot.topArchetypeScore)}
              </Text>
              <Text className="text-[10px] mt-1" style={{ color: isLight ? 'rgba(56,133,101,0.8)' : 'rgba(181,243,218,0.75)' }}>
                Top Archetype
              </Text>
              <Text className="text-[10px] font-semibold mt-0.5" style={{ color: isLight ? 'rgba(48,124,93,0.92)' : 'rgba(135,232,195,0.95)' }}>
                {snapshot.topArchetypeName.toUpperCase()}
              </Text>
            </View>

            <View
              className="flex-1 rounded-[14px] p-3 mr-2"
              style={{
                backgroundColor: 'rgba(92,70,212,0.13)',
                borderColor: 'rgba(92,70,212,0.34)',
                borderWidth: 1,
              }}
            >
              <Orbit size={15} color="#8C7CFF" />
              <Text className="text-[30px] font-bold mt-2" style={{ color: '#8C7CFF' }}>
                {formatDeepDivePercent(snapshot.topRoleFitScore)}
              </Text>
              <Text className="text-[10px] mt-1" style={{ color: isLight ? 'rgba(96,84,155,0.8)' : 'rgba(210,202,255,0.75)' }}>
                Best Role Fit
              </Text>
              <Text className="text-[10px] font-semibold mt-0.5" style={{ color: isLight ? 'rgba(85,73,147,0.92)' : 'rgba(194,182,255,0.95)' }}>
                {snapshot.topRoleDomain.toUpperCase()}
              </Text>
            </View>

            <View
              className="flex-1 rounded-[14px] p-3"
              style={{
                backgroundColor: 'rgba(201,168,76,0.11)',
                borderColor: 'rgba(201,168,76,0.32)',
                borderWidth: 1,
              }}
            >
              <AlertTriangle size={15} color="#E1C066" />
              <Text
                className="text-[13px] font-bold mt-2 leading-[16px]"
                style={{ color: isLight ? 'rgba(136,103,43,0.94)' : '#E9CB78' }}
                numberOfLines={2}
                android_hyphenationFrequency="none"
              >
                {snapshot.keyBlindSpotTitle}
              </Text>
              <Text className="text-[10px] mt-1" style={{ color: isLight ? 'rgba(141,112,58,0.82)' : 'rgba(236,218,170,0.78)' }}>
                Key Blind Spot
              </Text>
              <Text className="text-[10px] font-semibold mt-0.5" style={{ color: isLight ? 'rgba(126,97,47,0.92)' : 'rgba(232,209,150,0.95)' }}>
                MITIGATE EARLY
              </Text>
            </View>
          </View>

          <View
            className="rounded-[14px] px-3 py-3 mt-3"
            style={{
              backgroundColor: isLight ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.1)',
              borderColor: isLight ? 'rgba(170,141,92,0.34)' : 'rgba(201,168,76,0.28)',
              borderWidth: 1,
            }}
          >
            <View className="flex-row items-center mb-1">
              <Sparkles size={14} color="#E1C066" />
              <Text className="text-[22px] font-semibold ml-2" style={{ color: isLight ? 'rgba(85,67,34,0.92)' : 'rgba(240,234,214,0.92)' }}>
                Blueprint Summary
              </Text>
            </View>
            <Text className="text-[12px] leading-[18px]" style={{ color: isLight ? 'rgba(95,77,45,0.86)' : 'rgba(225,215,186,0.82)' }}>
              {snapshot.executiveSummary}
            </Text>
            <Text className="text-[10px] mt-2" style={{ color: isLight ? 'rgba(126,97,47,0.92)' : 'rgba(232,209,150,0.95)' }}>
              Current Phase: {snapshot.currentPhaseLabel}
            </Text>
            <Text className="text-[10px] mt-1" style={{ color: isLight ? 'rgba(126,97,47,0.92)' : 'rgba(232,209,150,0.95)' }}>
              Next Step: {snapshot.nextStep}
            </Text>
          </View>

          <View className="flex-row mt-3">
            <Pressable
              onPress={() => navigation.navigate('NatalChart')}
              className="flex-1 rounded-[12px] py-2.5 mr-2 items-center flex-row justify-center"
              style={{
                backgroundColor: isLight ? 'rgba(92,70,212,0.12)' : 'rgba(92,70,212,0.16)',
                borderColor: isLight ? 'rgba(92,70,212,0.28)' : 'rgba(92,70,212,0.36)',
                borderWidth: 1,
              }}
            >
              <Orbit size={13} color="#8C7CFF" />
              <Text className="text-[12px] font-semibold ml-1.5" style={{ color: isLight ? 'rgba(74,61,128,0.94)' : 'rgba(209,201,255,0.94)' }}>
                Natal Chart
              </Text>
            </Pressable>

            <Pressable
              onPress={handleOpenAnalysis}
              className="flex-1 rounded-[12px] py-2.5 items-center flex-row justify-center"
              style={{
                backgroundColor: isLight ? 'rgba(201,168,76,0.14)' : 'rgba(201,168,76,0.2)',
                borderColor: isLight ? 'rgba(170,141,92,0.34)' : 'rgba(201,168,76,0.38)',
                borderWidth: 1,
              }}
            >
              <Sparkles size={13} color="#E1C066" />
              <Text className="text-[12px] font-semibold ml-1.5" style={{ color: isLight ? 'rgba(102,79,39,0.96)' : 'rgba(240,225,178,0.96)' }}>
                Full Report
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <Text className="text-[10px] mt-2" style={{ color: 'rgba(212,212,224,0.46)' }}>
              Loading natal blueprint summary...
            </Text>
          ) : null}
        </View>
      ) : (
        <LockedDeepDiveCard onPress={handleOpenAnalysis} isLight={isLight} />
      )}
    </View>
  );
};
