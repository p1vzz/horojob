import React, { useEffect, useState } from 'react';
import { ZodiacCardLoaderFullscreen, type LoaderAppearance } from './ZodiacCardLoader';
import { ensureAuthSession } from '../../services/authSession';
import { loadOnboardingForUser } from '../../utils/onboardingStorage';
import { resolveZodiacSign, type ZodiacSign } from '../../utils/zodiac';

type FullScreenCosmicLoaderProps = {
  title?: string;
  subtitle?: string;
  sign?: ZodiacSign;
  appearance?: LoaderAppearance;
};

const FALLBACK_SIGN = resolveZodiacSign();

export const FullScreenCosmicLoader = ({
  title = 'Loading',
  subtitle = 'Please wait...',
  sign,
  appearance = 'dark',
}: FullScreenCosmicLoaderProps) => {
  const [resolvedSign, setResolvedSign] = useState<ZodiacSign>(sign ?? FALLBACK_SIGN);

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

  return <ZodiacCardLoaderFullscreen sign={resolvedSign} text={title} subtitle={subtitle} appearance={appearance} />;
};
