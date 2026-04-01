export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export const ZODIAC_SIGNS: ZodiacSign[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

export const ZODIAC_META: Record<ZodiacSign, { name: string; symbol: string }> = {
  aries: { name: 'ARIES', symbol: '\u2648\uFE0E' },
  taurus: { name: 'TAURUS', symbol: '\u2649\uFE0E' },
  gemini: { name: 'GEMINI', symbol: '\u264A\uFE0E' },
  cancer: { name: 'CANCER', symbol: '\u264B\uFE0E' },
  leo: { name: 'LEO', symbol: '\u264C\uFE0E' },
  virgo: { name: 'VIRGO', symbol: '\u264D\uFE0E' },
  libra: { name: 'LIBRA', symbol: '\u264E\uFE0E' },
  scorpio: { name: 'SCORPIO', symbol: '\u264F\uFE0E' },
  sagittarius: { name: 'SAGITTARIUS', symbol: '\u2650\uFE0E' },
  capricorn: { name: 'CAPRICORN', symbol: '\u2651\uFE0E' },
  aquarius: { name: 'AQUARIUS', symbol: '\u2652\uFE0E' },
  pisces: { name: 'PISCES', symbol: '\u2653\uFE0E' },
};

function isValidMonthDay(month: number, day: number) {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(2024, month - 1, day));
  return probe.getUTCMonth() + 1 === month && probe.getUTCDate() === day;
}

export function zodiacFromMonthDay(month: number, day: number): ZodiacSign {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius';
  return 'pisces';
}

export function zodiacFromDate(date: Date): ZodiacSign {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return zodiacFromMonthDay(month, day);
}

function parseBirthDate(raw: string): { month: number; day: number } | null {
  const value = raw.trim();
  if (!value) return null;

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (slashMatch) {
    const day = Number.parseInt(slashMatch[1], 10);
    const month = Number.parseInt(slashMatch[2], 10);
    if (!isValidMonthDay(month, day)) return null;
    return { month, day };
  }

  const dashMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (dashMatch) {
    const month = Number.parseInt(dashMatch[2], 10);
    const day = Number.parseInt(dashMatch[3], 10);
    if (!isValidMonthDay(month, day)) return null;
    return { month, day };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return { month: parsed.getMonth() + 1, day: parsed.getDate() };
}

export function zodiacFromBirthDate(birthDate: string | null | undefined): ZodiacSign | null {
  if (!birthDate) return null;
  const parsed = parseBirthDate(birthDate);
  if (!parsed) return null;
  return zodiacFromMonthDay(parsed.month, parsed.day);
}

export function resolveZodiacSign(options?: {
  birthDate?: string | null;
  fallbackDate?: Date;
}): ZodiacSign {
  const sign = zodiacFromBirthDate(options?.birthDate ?? null);
  if (sign) return sign;
  return zodiacFromDate(options?.fallbackDate ?? new Date());
}
