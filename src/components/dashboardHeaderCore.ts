export const DASHBOARD_ZODIAC_SIGNS = [
  '\u2648\uFE0E',
  '\u2649\uFE0E',
  '\u264A\uFE0E',
  '\u264B\uFE0E',
  '\u264C\uFE0E',
  '\u264D\uFE0E',
  '\u264E\uFE0E',
  '\u264F\uFE0E',
  '\u2650\uFE0E',
  '\u2651\uFE0E',
  '\u2652\uFE0E',
  '\u2653\uFE0E',
] as const;

export type DashboardMiniPosition = {
  s: string;
  x: number;
  y: number;
};

function normalizeRoundedCoordinate(value: number) {
  const rounded = Math.round(value);
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function buildDashboardMiniPositions(radius = 14): DashboardMiniPosition[] {
  return DASHBOARD_ZODIAC_SIGNS.map((s, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    return {
      s,
      x: normalizeRoundedCoordinate(Math.cos(angle) * radius),
      y: normalizeRoundedCoordinate(Math.sin(angle) * radius),
    };
  });
}

export function resolveDashboardGreeting(hour: number) {
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}
