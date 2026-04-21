import React, { useEffect, useState } from 'react';
import { ZodiacCardLoaderFullscreen, type LoaderAppearance } from './ZodiacCardLoader';
import { ensureAuthSession } from '../../services/authSession';
import { loadOnboardingForUser } from '../../utils/onboardingStorage';
import { resolveZodiacSign, type ZodiacSign } from '../../utils/zodiac';

type FullScreenCosmicLoaderProps = {
  title?: string;
  subtitle?: string;
  sign?: ZodiacSign;
  steps?: readonly string[];
  activeStepIndex?: number;
  appearance?: LoaderAppearance;
};

const FALLBACK_SIGN = resolveZodiacSign();

export const FullScreenCosmicLoader = ({
  title = 'Loading',
  subtitle = 'Please wait...',
  sign,
  steps,
  activeStepIndex,
  appearance = 'dark',
}: FullScreenCosmicLoaderProps) => {
  const [resolvedSign, setResolvedSign] = useState<ZodiacSign>(sign ?? FALLBACK_SIGN);
  const [autoActiveStepIndex, setAutoActiveStepIndex] = useState(0);

  useEffect(() => {
    if (sign) {
      setResolvedSign(sign);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        const session = await ensureAuthSession();
        const onboarding = await loadOnboardingForUser(session.user.id);
        if (!mounted) return;
        setResolvedSign(resolveZodiacSign({ birthDate: onboarding?.birthDate ?? null }));
      } catch {
        if (mounted) {
          setResolvedSign(resolveZodiacSign());
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [sign]);

  useEffect(() => {
    if (typeof activeStepIndex === 'number') {
      return;
    }

    if (!steps || steps.length <= 1) {
      setAutoActiveStepIndex(0);
      return;
    }

    setAutoActiveStepIndex(0);
    const intervalId = setInterval(() => {
      setAutoActiveStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }, 2200);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeStepIndex, steps]);

  return (
    <ZodiacCardLoaderFullscreen
      sign={resolvedSign}
      text={title}
      subtitle={subtitle}
      steps={steps}
      activeStepIndex={activeStepIndex ?? autoActiveStepIndex}
      appearance={appearance}
    />
  );
};
