import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Animated, type LayoutChangeEvent } from 'react-native';
import { Cpu, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';
import { useAppTheme } from '../theme/ThemeModeProvider';
import { useAiSynergy } from '../hooks/queries/useAiSynergy';
import {
  formatAiSynergyConfidenceLabel,
  resolveAiSynergyPalette,
  selectAiSynergyView,
} from './aiSynergyTileCore';
import { AI_SYNERGY_HELIX_POINTS } from './aiSynergyTileVisuals';

const AI_SYNERGY_PENDING_POLL_INTERVAL_MS = 5_000;
const AI_SYNERGY_PENDING_POLL_MAX_ATTEMPTS = 12;

const SkeletonBar = ({
  width,
  height,
}: {
  width: number | `${number}%`;
  height: number;
}) => (
  <View
    style={{
      width,
      height,
      borderRadius: 6,
      backgroundColor: 'rgba(255,255,255,0.08)',
    }}
  />
);

export const AiSynergyTile = React.memo(({ onReady }: { onReady?: () => void }) => {
  const theme = useAppTheme();
  const scanAnim = useRef(new Animated.Value(0)).current;
  const [cardHeight, setCardHeight] = useState(124);
  const [hasPendingTimedOut, setHasPendingTimedOut] = useState(false);
  const { data: aiSynergy, isError, isFetching, isLoading, refetch } = useAiSynergy();
  const hasSignaledReadyRef = useRef(false);
  const pendingPollCountRef = useRef(0);

  const synergy = selectAiSynergyView(aiSynergy);
  const hasSynergy = Boolean(synergy);
  const isNarrativeReady =
    synergy?.narrativeStatus === 'ready' &&
    Boolean(synergy.headline?.trim()) &&
    Boolean(synergy.description?.trim());
  const isNarrativePending = synergy?.narrativeStatus === 'pending';
  const shouldShowSkeleton =
    !isError &&
    !hasPendingTimedOut &&
    ((isLoading && !aiSynergy) || isNarrativePending);

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    scanLoop.start();
    return () => scanLoop.stop();
  }, [scanAnim]);

  useEffect(() => {
    if (!shouldShowSkeleton && !hasSignaledReadyRef.current) {
      hasSignaledReadyRef.current = true;
      onReady?.();
    }
  }, [onReady, shouldShowSkeleton]);

  useEffect(() => {
    if (!isNarrativePending) {
      pendingPollCountRef.current = 0;
      setHasPendingTimedOut(false);
      return;
    }
    if (isFetching) return;
    if (pendingPollCountRef.current >= AI_SYNERGY_PENDING_POLL_MAX_ATTEMPTS) {
      setHasPendingTimedOut(true);
      return;
    }

    const timer = setTimeout(() => {
      pendingPollCountRef.current += 1;
      void refetch();
    }, AI_SYNERGY_PENDING_POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [isFetching, isNarrativePending, refetch]);

  const handleCardLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (nextHeight > 0) {
      setCardHeight((currentHeight) => (currentHeight === nextHeight ? currentHeight : nextHeight));
    }
  }, []);

  const scanTranslate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, Math.max(110, cardHeight - 8)],
  });

  const { scoreColor, scoreSubColor } = resolveAiSynergyPalette(synergy?.score ?? 0);
  const confidenceLabel = synergy
    ? formatAiSynergyConfidenceLabel(synergy.confidence)
    : "Today's signal is not ready";
  const canDescribePendingNarrative = isNarrativePending && !hasPendingTimedOut && !isError;
  const statusHeadline = isNarrativeReady
    ? synergy?.headline
    : canDescribePendingNarrative
      ? "Today's guidance is preparing"
      : "Today's guidance is unavailable";
  const statusDescription = isNarrativeReady
    ? synergy?.description
    : synergy
      ? "The score is ready, but the written guidance could not be prepared yet. Keep decisions grounded in your own review checkpoints."
      : "We could not refresh this signal yet. Reopen Horojob when the connection is stable.";
  const bestMove = isNarrativeReady && synergy?.recommendations[0]
    ? `Best move: ${synergy.recommendations[0]}`
    : 'Best move: Use one clear review checkpoint before acting on AI-assisted work.';

  if (shouldShowSkeleton) {
    return (
      <View className="px-5 py-2">
        <View
          className="p-5 rounded-[24px] overflow-hidden relative"
          onLayout={handleCardLayout}
          style={{
            minHeight: 242,
            backgroundColor: 'rgba(56,204,136,0.04)',
            borderColor: 'rgba(56,204,136,0.1)',
            borderWidth: 1,
          }}
        >
          <View className="absolute right-0 top-2.5 bottom-2.5 w-20">
            <Svg height="100%" width="80" viewBox="0 0 100 100">
              <G opacity="0.12">
                {AI_SYNERGY_HELIX_POINTS.map((p, i) => (
                  <G key={i}>
                    <Circle cx={p.x1} cy={p.y} r="1.5" fill="#00FFCC" />
                    <Circle cx={p.x2} cy={p.y} r="1.5" fill="#00FFCC" />
                    {i % 2 === 0 ? (
                      <Line x1={p.x1} y1={p.y} x2={p.x2} y2={p.y} stroke="#00FFCC" strokeWidth="0.4" strokeDasharray="2 2" />
                    ) : null}
                  </G>
                ))}
                <Path
                  d={`M ${AI_SYNERGY_HELIX_POINTS.map((p) => `${p.x1} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="#00FFCC"
                  strokeWidth="0.6"
                  opacity="0.5"
                />
                <Path
                  d={`M ${AI_SYNERGY_HELIX_POINTS.map((p) => `${p.x2} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="#00FFCC"
                  strokeWidth="0.6"
                  opacity="0.5"
                />
              </G>
            </Svg>
          </View>

          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 1,
              transform: [{ translateY: scanTranslate }],
              opacity: 0.32,
              backgroundColor: 'transparent',
            }}
          >
            <LinearGradient
              colors={['transparent', '#00FFCC', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ height: 1 }}
            />
          </Animated.View>

          <View className="flex-row items-center mb-4">
            <View
              className="w-8 h-8 rounded-[10px] justify-center items-center mr-2.5"
              style={{
                backgroundColor: 'rgba(0,255,204,0.08)',
                borderColor: 'rgba(0,255,204,0.12)',
                borderWidth: 1,
              }}
            >
              <Cpu size={15} color="rgba(0,255,204,0.76)" />
            </View>
            <View className="flex-1">
              <SkeletonBar width="48%" height={14} />
              <View style={{ height: 8 }} />
              <SkeletonBar width="34%" height={10} />
            </View>
          </View>

          <View className="flex-row items-baseline mb-3">
            <SkeletonBar width={82} height={44} />
            <View style={{ width: 7 }} />
            <SkeletonBar width={18} height={22} />
          </View>

          <View style={{ paddingRight: 42, marginBottom: 16 }}>
            <SkeletonBar width="76%" height={12} />
            <View style={{ height: 12 }} />
            <SkeletonBar width="96%" height={13} />
            <View style={{ height: 8 }} />
            <SkeletonBar width="88%" height={13} />
            <View style={{ height: 8 }} />
            <SkeletonBar width="58%" height={13} />
          </View>

          <View style={{ paddingRight: 34, marginBottom: 13 }}>
            <SkeletonBar width="74%" height={11} />
          </View>

          <View className="flex-row items-center">
            <View
              style={{
                width: 11,
                height: 11,
                borderRadius: 999,
                marginRight: 6,
                backgroundColor: 'rgba(0,255,204,0.14)',
              }}
            />
            <SkeletonBar width="58%" height={10} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="px-5 py-2">
      <View
        className="p-5 rounded-[24px] overflow-hidden relative"
        onLayout={handleCardLayout}
        style={{
          backgroundColor: 'rgba(56,204,136,0.04)',
          borderColor: 'rgba(56,204,136,0.1)',
          borderWidth: 1,
        }}
      >
        <View className="absolute right-0 top-2.5 bottom-2.5 w-20">
          <Svg height="100%" width="80" viewBox="0 0 100 100">
            <G opacity="0.15">
              {AI_SYNERGY_HELIX_POINTS.map((p, i) => (
                <G key={i}>
                  <Circle cx={p.x1} cy={p.y} r="1.5" fill="#00FFCC" />
                  <Circle cx={p.x2} cy={p.y} r="1.5" fill="#00FFCC" />
                  {i % 2 === 0 ? (
                    <Line x1={p.x1} y1={p.y} x2={p.x2} y2={p.y} stroke="#00FFCC" strokeWidth="0.4" strokeDasharray="2 2" />
                  ) : null}
                </G>
              ))}
              <Path
                d={`M ${AI_SYNERGY_HELIX_POINTS.map((p) => `${p.x1} ${p.y}`).join(' L ')}`}
                fill="none"
                stroke="#00FFCC"
                strokeWidth="0.6"
                opacity="0.5"
              />
              <Path
                d={`M ${AI_SYNERGY_HELIX_POINTS.map((p) => `${p.x2} ${p.y}`).join(' L ')}`}
                fill="none"
                stroke="#00FFCC"
                strokeWidth="0.6"
                opacity="0.5"
              />
            </G>
          </Svg>
        </View>

        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 1,
            transform: [{ translateY: scanTranslate }],
            opacity: 0.4,
            backgroundColor: 'transparent',
          }}
        >
          <LinearGradient
            colors={['transparent', '#00FFCC', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ height: 1 }}
          />
        </Animated.View>

        <View className="flex-row items-center mb-3">
          <Cpu size={15} color="#00FFCC" />
          <Text className="text-[13px] font-semibold ml-2" style={{ color: theme.colors.foreground }}>
            Today&apos;s AI Synergy
          </Text>
        </View>

        {shouldShowSkeleton ? (
          <View style={{ minHeight: 154 }}>
            <View className="flex-row items-baseline mb-3">
              <SkeletonBar width={82} height={44} />
              <View style={{ width: 7 }} />
              <SkeletonBar width={18} height={22} />
            </View>
            <View style={{ marginBottom: 14 }}>
              <SkeletonBar width="62%" height={12} />
            </View>
            <View style={{ paddingRight: 40, marginBottom: 16 }}>
              <SkeletonBar width="96%" height={13} />
              <View style={{ height: 8 }} />
              <SkeletonBar width="84%" height={13} />
              <View style={{ height: 8 }} />
              <SkeletonBar width="54%" height={13} />
            </View>
            <View style={{ paddingRight: 32, marginBottom: 13 }}>
              <SkeletonBar width="72%" height={11} />
            </View>
          </View>
        ) : (
          <>
            <View className="flex-row items-baseline mb-1">
              <Text className="text-[44px] font-bold" style={{ color: scoreColor }}>{hasSynergy ? synergy?.score : '--'}</Text>
              <Text className="text-[22px] font-bold ml-1" style={{ color: scoreSubColor }}>{hasSynergy ? '%' : ''}</Text>
            </View>

            <Text className="text-[12px] mb-3" style={{ color: 'rgba(212,212,224,0.5)' }}>
              {statusHeadline}
            </Text>

            <Text className="text-[13px] leading-[20px] mb-4 pr-10" style={{ color: 'rgba(212,212,224,0.75)' }}>
              {statusDescription}
            </Text>

            <Text className="text-[11px] mb-3 pr-8" style={{ color: 'rgba(212,212,224,0.58)' }}>
              {bestMove}
            </Text>
          </>
        )}

        <View className="flex-row items-center">
          <Activity size={11} color="#00FFCC" style={{ opacity: 0.9, marginRight: 6 }} />
          <Text className="text-[10px] tracking-[1.5px] uppercase font-semibold" style={{ color: 'rgba(212,212,224,0.45)' }}>
            {isLoading ? "Syncing today's AI signal" : confidenceLabel}
          </Text>
        </View>
      </View>
    </View>
  );
});
