import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Brightness from 'expo-brightness';
import {
  BRIGHTNESS_SAMPLE_INTERVAL_MS,
  resolveBrightnessBoostChannels,
  resolveBrightnessTier,
  type BrightnessBoostChannels,
  type BrightnessTier,
  clampBrightnessSample,
} from './brightnessAdaptationCore';

export type BrightnessAdaptation = {
  systemBrightness: number;
  tier: BrightnessTier;
  boostMultiplier: number;
  channels: BrightnessBoostChannels;
  isAdaptive: boolean;
};

type BrightnessAdaptationContextValue = BrightnessAdaptation & {
  registerConsumer: () => () => void;
};

const NEUTRAL_CHANNELS = resolveBrightnessBoostChannels('medium', false);

const BrightnessAdaptationContext = createContext<BrightnessAdaptationContextValue>({
  systemBrightness: 0.5,
  tier: 'medium',
  boostMultiplier: 1,
  channels: NEUTRAL_CHANNELS,
  isAdaptive: false,
  registerConsumer: () => () => {},
});

export function useBrightnessAdaptation(options: { enabled?: boolean } = {}): BrightnessAdaptation {
  const { enabled = true } = options;
  const context = useContext(BrightnessAdaptationContext);
  const { registerConsumer } = context;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return registerConsumer();
  }, [enabled, registerConsumer]);

  return {
    systemBrightness: context.systemBrightness,
    tier: context.tier,
    boostMultiplier: context.boostMultiplier,
    channels: context.channels,
    isAdaptive: context.isAdaptive,
  };
}

type BrightnessAdaptationProviderProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

export function BrightnessAdaptationProvider({
  children,
  enabled = true,
}: BrightnessAdaptationProviderProps) {
  const [systemBrightness, setSystemBrightness] = useState(0.5);
  const [tier, setTier] = useState<BrightnessTier>('medium');
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [activeConsumerCount, setActiveConsumerCount] = useState(0);
  const hasActiveConsumers = activeConsumerCount > 0;
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSampling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const sampleBrightness = useCallback(async () => {
    const sampled = clampBrightnessSample(await Brightness.getBrightnessAsync());
    setSystemBrightness(sampled);
    setTier((currentTier) => resolveBrightnessTier(sampled, currentTier));
  }, []);

  const startSampling = useCallback(async () => {
    stopSampling();

    try {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status !== 'granted') {
        setIsAdaptive(false);
        return;
      }

      setIsAdaptive(true);
      await sampleBrightness();
      intervalRef.current = setInterval(() => {
        void sampleBrightness().catch(() => {
          // Keep the last known adaptation state if a sample fails.
        });
      }, BRIGHTNESS_SAMPLE_INTERVAL_MS);
    } catch {
      setIsAdaptive(false);
    }
  }, [sampleBrightness, stopSampling]);

  const registerConsumer = useCallback(() => {
    setActiveConsumerCount((count) => count + 1);

    return () => {
      setActiveConsumerCount((count) => Math.max(0, count - 1));
    };
  }, []);

  useEffect(() => {
    if (!enabled || !hasActiveConsumers) {
      stopSampling();
      setIsAdaptive(false);
      return;
    }

    const syncForAppState = (nextState: AppStateStatus) => {
      appStateRef.current = nextState;

      if (nextState === 'active') {
        void startSampling();
        return;
      }

      stopSampling();
    };

    const appStateSubscription = AppState.addEventListener('change', syncForAppState);

    if (appStateRef.current === 'active') {
      void startSampling();
    }

    return () => {
      appStateSubscription.remove();
      stopSampling();
    };
  }, [enabled, hasActiveConsumers, startSampling, stopSampling]);

  const channels = useMemo(
    () => resolveBrightnessBoostChannels(tier, isAdaptive),
    [isAdaptive, tier]
  );

  const value = useMemo<BrightnessAdaptationContextValue>(
    () => ({
      systemBrightness,
      tier,
      boostMultiplier: channels.intensityMultiplier,
      channels,
      isAdaptive,
      registerConsumer,
    }),
    [channels, isAdaptive, registerConsumer, systemBrightness, tier]
  );

  return (
    <BrightnessAdaptationContext.Provider value={value}>
      {children}
    </BrightnessAdaptationContext.Provider>
  );
}
