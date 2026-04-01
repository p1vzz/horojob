type CityGeoState = {
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  admin1: string | null;
};

type OnboardingSubmitPayload = {
  name: string;
  birthDate: string;
  birthTime: string | null;
  unknownTime: boolean;
  city: string;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  admin1: string | null;
};

export function formatOnboardingDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatOnboardingTime(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function countOnboardingFilledFields(input: {
  name: string;
  birthDate: string;
  birthTime: string;
  unknownTime: boolean;
  citySelected: boolean;
}) {
  let count = 0;
  if (input.name.trim()) count++;
  if (input.birthDate) count++;
  if (input.birthTime || input.unknownTime) count++;
  if (input.citySelected) count++;
  return count;
}

export function buildOnboardingSubmitPayload(input: {
  name: string;
  birthDate: string;
  birthTime: string;
  unknownTime: boolean;
  city: string;
  cityGeo: CityGeoState | null;
}): OnboardingSubmitPayload {
  return {
    name: input.name.trim(),
    birthDate: input.birthDate,
    birthTime: input.unknownTime ? null : input.birthTime,
    unknownTime: input.unknownTime,
    city: input.city,
    latitude: input.cityGeo?.latitude ?? null,
    longitude: input.cityGeo?.longitude ?? null,
    country: input.cityGeo?.country ?? null,
    admin1: input.cityGeo?.admin1 ?? null,
  };
}

export function resolveOnboardingSubmitError(error: unknown) {
  if (isApiErrorLike(error)) {
    const payload =
      error.payload && typeof error.payload === 'object' ? (error.payload as Record<string, unknown>) : null;
    const serverMessage =
      typeof payload?.error === 'string'
        ? payload.error
        : typeof payload?.message === 'string'
          ? payload.message
          : null;

    if (error.status >= 500) {
      return 'Server is temporarily unavailable. Please try again in a minute.';
    }
    return serverMessage ?? `Could not save birth details (${error.status}).`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Could not save birth details. Check connection and try again.';
}

function isApiErrorLike(error: unknown): error is { status: number; payload: unknown } {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { status?: unknown; payload?: unknown };
  return typeof candidate.status === 'number' && 'payload' in candidate;
}
