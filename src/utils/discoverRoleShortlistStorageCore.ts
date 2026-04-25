import { parseOccupationInsightResponse, type OccupationInsightResponse } from '../services/marketApiCore';
import type { DiscoverRoleDetail } from '../services/astrologyApiCore';

export const DISCOVER_ROLE_SHORTLIST_LIMIT = 12;

export type DiscoverRoleShortlistEntry = {
  slug: string;
  role: string;
  domain: string;
  scoreLabel: string | null;
  scoreValue: number | null;
  tags: string[];
  market: OccupationInsightResponse | null;
  detail: DiscoverRoleDetail | null;
  savedAt: string;
};

export type DiscoverRoleShortlistByUser = Record<string, DiscoverRoleShortlistEntry[]>;

export type DiscoverRoleShortlistInput = Omit<DiscoverRoleShortlistEntry, 'savedAt'>;

function asRecord(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

function asStringArray(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function asNullableNumber(input: unknown) {
  return typeof input === 'number' && Number.isFinite(input) ? input : null;
}

function parseEntry(input: unknown): DiscoverRoleShortlistEntry | null {
  const row = asRecord(input);
  if (!row) return null;
  const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
  const role = typeof row.role === 'string' ? row.role.trim() : '';
  const savedAt = typeof row.savedAt === 'string' ? row.savedAt : '';
  if (!slug || !role || !savedAt) return null;

  return {
    slug,
    role,
    domain: typeof row.domain === 'string' ? row.domain : 'Career path',
    scoreLabel: typeof row.scoreLabel === 'string' ? row.scoreLabel : null,
    scoreValue: asNullableNumber(row.scoreValue),
    tags: asStringArray(row.tags).slice(0, 6),
    market: row.market ? parseOccupationInsightResponse(row.market) : null,
    detail: parseDiscoverRoleDetail(row.detail),
    savedAt,
  };
}

function toTimestamp(iso: string) {
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mergeDiscoverRoleShortlistEntries(
  entries: DiscoverRoleShortlistEntry[],
  limit = DISCOVER_ROLE_SHORTLIST_LIMIT,
) {
  const bySlug = new Map<string, DiscoverRoleShortlistEntry>();

  for (const entry of entries) {
    const existing = bySlug.get(entry.slug);
    if (!existing || toTimestamp(entry.savedAt) >= toTimestamp(existing.savedAt)) {
      bySlug.set(entry.slug, {
        ...entry,
        tags: entry.tags.slice(0, 6),
      });
    }
  }

  return Array.from(bySlug.values())
    .sort((a, b) => toTimestamp(b.savedAt) - toTimestamp(a.savedAt))
    .slice(0, limit);
}

export function selectDiscoverRoleShortlistEntriesForSync(
  localEntries: DiscoverRoleShortlistEntry[],
  remoteEntries: DiscoverRoleShortlistEntry[],
) {
  const remoteBySlug = new Map(
    mergeDiscoverRoleShortlistEntries(remoteEntries, Number.MAX_SAFE_INTEGER).map((entry) => [entry.slug, entry]),
  );

  return mergeDiscoverRoleShortlistEntries(localEntries, Number.MAX_SAFE_INTEGER).filter((entry) => {
    const remoteEntry = remoteBySlug.get(entry.slug);
    if (!remoteEntry) {
      return true;
    }
    return toTimestamp(entry.savedAt) > toTimestamp(remoteEntry.savedAt);
  });
}

export function parseDiscoverRoleShortlistByUser(raw: string | null): DiscoverRoleShortlistByUser {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    const root = asRecord(parsed);
    if (!root) return {};

    const output: DiscoverRoleShortlistByUser = {};
    for (const [userId, value] of Object.entries(root)) {
      if (!userId || !Array.isArray(value)) continue;
      output[userId] = value
        .map((entry) => parseEntry(entry))
        .filter((entry): entry is DiscoverRoleShortlistEntry => entry !== null)
        .slice(0, DISCOVER_ROLE_SHORTLIST_LIMIT);
      output[userId] = mergeDiscoverRoleShortlistEntries(output[userId] ?? []);
    }
    return output;
  } catch {
    return {};
  }
}

export function upsertDiscoverRoleShortlistEntry(
  existing: DiscoverRoleShortlistEntry[],
  incoming: DiscoverRoleShortlistInput,
  savedAt: string,
) {
  const nextEntry: DiscoverRoleShortlistEntry = {
    ...incoming,
    savedAt,
    tags: incoming.tags.slice(0, 6),
  };
  return mergeDiscoverRoleShortlistEntries([nextEntry, ...existing]);
}

export function removeDiscoverRoleShortlistEntry(existing: DiscoverRoleShortlistEntry[], slug: string) {
  return existing.filter((entry) => entry.slug !== slug);
}

const DISCOVER_ENTRY_BARRIER_LEVELS = ['accessible', 'moderate', 'specialized', 'high'] as const;
const DISCOVER_TRANSITION_LANES = ['best_match', 'easier_entry', 'higher_ceiling'] as const;

function parseDiscoverRoleDetail(input: unknown): DiscoverRoleDetail | null {
  const row = asRecord(input);
  if (!row) return null;
  const whyFit = asRecord(row.whyFit);
  const realityCheck = asRecord(row.realityCheck);
  const entryBarrier = asRecord(row.entryBarrier);
  if (!whyFit || !realityCheck || !entryBarrier) return null;

  const whySummary = typeof whyFit.summary === 'string' ? whyFit.summary.trim() : '';
  const realitySummary = typeof realityCheck.summary === 'string' ? realityCheck.summary.trim() : '';
  const barrierLabel = typeof entryBarrier.label === 'string' ? entryBarrier.label.trim() : '';
  const barrierSummary = typeof entryBarrier.summary === 'string' ? entryBarrier.summary.trim() : '';
  const barrierLevel = DISCOVER_ENTRY_BARRIER_LEVELS.find((level) => level === entryBarrier.level) ?? null;
  if (!whySummary || !realitySummary || !barrierLabel || !barrierSummary || !barrierLevel) {
    return null;
  }

  return {
    whyFit: {
      summary: whySummary,
      bullets: asStringArray(whyFit.bullets).slice(0, 4),
      topTraits: asStringArray(whyFit.topTraits).slice(0, 4),
    },
    realityCheck: {
      summary: realitySummary,
      tasks: asStringArray(realityCheck.tasks).slice(0, 4),
      workContext: asStringArray(realityCheck.workContext).slice(0, 4),
      toolThemes: asStringArray(realityCheck.toolThemes).slice(0, 4),
    },
    entryBarrier: {
      level: barrierLevel,
      label: barrierLabel,
      summary: barrierSummary,
      signals: asStringArray(entryBarrier.signals).slice(0, 4),
    },
    transitionMap: parseDiscoverRoleTransitionMap(row.transitionMap),
    bestAlternative: parseDiscoverRoleBestAlternative(row.bestAlternative),
  };
}

function parseDiscoverRoleTransitionMap(input: unknown): DiscoverRoleDetail['transitionMap'] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const row = asRecord(item);
      const lane = DISCOVER_TRANSITION_LANES.find((level) => level === row?.lane) ?? null;
      const label = typeof row?.label === 'string' ? row.label.trim() : '';
      const summary = typeof row?.summary === 'string' ? row.summary.trim() : '';
      const role = parseDecisionRole(row?.role);
      if (!lane || !label || !summary || !role) return null;
      return {
        lane,
        label,
        summary,
        role,
      };
    })
    .filter((item): item is DiscoverRoleDetail['transitionMap'][number] => item !== null)
    .slice(0, 3);
}

function parseDiscoverRoleBestAlternative(input: unknown): DiscoverRoleDetail['bestAlternative'] {
  const row = asRecord(input);
  if (!row) return null;
  const headline = typeof row.headline === 'string' ? row.headline.trim() : '';
  const summary = typeof row.summary === 'string' ? row.summary.trim() : '';
  const role = parseDecisionRole(row.role);
  if (!headline || !summary || !role) return null;

  return {
    headline,
    summary,
    reasons: asStringArray(row.reasons).slice(0, 4),
    role,
  };
}

function parseDecisionRole(input: unknown): NonNullable<DiscoverRoleDetail['bestAlternative']>['role'] | null {
  const row = asRecord(input);
  const barrier = asRecord(row?.barrier);
  if (!row || !barrier) return null;
  const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
  const title = typeof row.title === 'string' ? row.title.trim() : '';
  const domain = typeof row.domain === 'string' ? row.domain.trim() : '';
  const fitScore = asNullableNumber(row.fitScore);
  const fitLabel = typeof row.fitLabel === 'string' ? row.fitLabel.trim() : '';
  const barrierLevel = DISCOVER_ENTRY_BARRIER_LEVELS.find((level) => level === barrier.level) ?? null;
  const barrierLabel = typeof barrier.label === 'string' ? barrier.label.trim() : '';
  if (!slug || !title || !domain || fitScore === null || !fitLabel || !barrierLevel || !barrierLabel) {
    return null;
  }

  return {
    slug,
    title,
    domain,
    fitScore,
    fitLabel,
    barrier: {
      level: barrierLevel,
      label: barrierLabel,
    },
  };
}
