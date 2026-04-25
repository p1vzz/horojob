import type { DiscoverRoleShortlistEntry } from '../utils/discoverRoleShortlistStorage';

export type DiscoverRoleCompareValue = {
  title: string;
  subtitle: string | null;
  tone: 'default' | 'positive' | 'warning' | 'accent';
};

export type DiscoverRoleCompareRow = {
  key: 'fit' | 'market' | 'entry_barrier' | 'reality' | 'transition';
  label: string;
  left: DiscoverRoleCompareValue;
  right: DiscoverRoleCompareValue;
};

const DISCOVER_COMPARE_LIMIT = 2;

function formatCompactMoney(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function formatMarketSalary(entry: DiscoverRoleShortlistEntry) {
  const salary = entry.market?.salary;
  if (!salary) return null;
  const min = formatCompactMoney(salary.min);
  const max = formatCompactMoney(salary.max);
  const median = formatCompactMoney(salary.median);
  if (min && max) return `${min}-${max}`;
  if (median) return `${median} median`;
  return null;
}

function formatMarketDemand(entry: DiscoverRoleShortlistEntry) {
  if (!entry.market) return null;
  const openings = entry.market.outlook.projectedOpenings;
  if (typeof openings === 'number' && Number.isFinite(openings)) {
    return `${Math.round(openings).toLocaleString()} openings`;
  }
  return entry.market.outlook.demandLabel === 'unknown' ? null : `${entry.market.outlook.demandLabel} demand`;
}

function fitValue(entry: DiscoverRoleShortlistEntry): DiscoverRoleCompareValue {
  return {
    title: entry.scoreLabel ?? 'Fit unavailable',
    subtitle: entry.tags[0] ?? null,
    tone: 'positive',
  };
}

function marketValue(entry: DiscoverRoleShortlistEntry): DiscoverRoleCompareValue {
  const marketScore = entry.market?.labels.marketScore ?? 'Limited data';
  const salary = formatMarketSalary(entry);
  const demand = formatMarketDemand(entry);
  return {
    title: marketScore,
    subtitle: [salary, demand].filter(Boolean).join(' - ') || null,
    tone: 'accent',
  };
}

function entryBarrierValue(entry: DiscoverRoleShortlistEntry): DiscoverRoleCompareValue {
  const barrier = entry.detail?.entryBarrier;
  return {
    title: barrier?.label ?? 'Barrier unavailable',
    subtitle: barrier?.summary ?? null,
    tone:
      barrier?.level === 'accessible'
        ? 'positive'
        : barrier?.level === 'moderate'
          ? 'warning'
          : barrier?.level === 'specialized'
            ? 'accent'
            : 'default',
  };
}

function realityValue(entry: DiscoverRoleShortlistEntry): DiscoverRoleCompareValue {
  const detail = entry.detail;
  return {
    title: detail?.realityCheck.summary ?? 'Reality snapshot unavailable',
    subtitle: detail?.realityCheck.tasks[0] ?? null,
    tone: 'default',
  };
}

function transitionValue(entry: DiscoverRoleShortlistEntry): DiscoverRoleCompareValue {
  const firstPath = entry.detail?.transitionMap[0] ?? null;
  const bestAlternative = entry.detail?.bestAlternative ?? null;
  if (firstPath) {
    return {
      title: firstPath.label,
      subtitle: firstPath.summary,
      tone: 'accent',
    };
  }
  if (bestAlternative) {
    return {
      title: bestAlternative.headline,
      subtitle: bestAlternative.summary,
      tone: 'accent',
    };
  }
  return {
    title: 'General fit framing',
    subtitle: entry.detail?.whyFit.summary ?? null,
    tone: 'default',
  };
}

export function toggleDiscoverRoleCompareSelection(current: string[], slug: string) {
  if (current.includes(slug)) {
    return current.filter((item) => item !== slug);
  }
  if (current.length < DISCOVER_COMPARE_LIMIT) {
    return [...current, slug];
  }
  return [current[1], slug];
}

export function normalizeDiscoverRoleCompareSelection(current: string[], availableSlugs: string[]) {
  const available = new Set(availableSlugs);
  const next: string[] = [];
  for (const slug of current) {
    if (available.has(slug) && !next.includes(slug)) {
      next.push(slug);
    }
    if (next.length >= DISCOVER_COMPARE_LIMIT) break;
  }
  return next;
}

export function buildDiscoverRoleCompareRows(
  left: DiscoverRoleShortlistEntry,
  right: DiscoverRoleShortlistEntry,
): DiscoverRoleCompareRow[] {
  return [
    {
      key: 'fit',
      label: 'Fit',
      left: fitValue(left),
      right: fitValue(right),
    },
    {
      key: 'market',
      label: 'Market',
      left: marketValue(left),
      right: marketValue(right),
    },
    {
      key: 'entry_barrier',
      label: 'Entry Barrier',
      left: entryBarrierValue(left),
      right: entryBarrierValue(right),
    },
    {
      key: 'reality',
      label: 'Reality Snapshot',
      left: realityValue(left),
      right: realityValue(right),
    },
    {
      key: 'transition',
      label: 'Transition Framing',
      left: transitionValue(left),
      right: transitionValue(right),
    },
  ];
}
