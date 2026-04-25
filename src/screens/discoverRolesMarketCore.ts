import type { DiscoverRoleShortlistEntry } from '../utils/discoverRoleShortlistStorage';

export function mergeDiscoverRoleMarketEntries(
  entries: DiscoverRoleShortlistEntry[],
): DiscoverRoleShortlistEntry[] {
  const orderedSlugs: string[] = [];
  const bySlug = new Map<string, DiscoverRoleShortlistEntry>();

  for (const entry of entries) {
    if (!bySlug.has(entry.slug)) {
      orderedSlugs.push(entry.slug);
    }
    bySlug.set(entry.slug, entry);
  }

  return orderedSlugs
    .map((slug) => bySlug.get(slug) ?? null)
    .filter((entry): entry is DiscoverRoleShortlistEntry => entry !== null);
}

export function upsertDiscoverRoleMarketEntry(
  current: DiscoverRoleShortlistEntry[],
  next: DiscoverRoleShortlistEntry,
  options?: { prependNew?: boolean },
) {
  const existingIndex = current.findIndex((entry) => entry.slug === next.slug);
  if (existingIndex >= 0) {
    return current.map((entry, index) => (index === existingIndex ? next : entry));
  }

  return options?.prependNew ? [next, ...current] : [...current, next];
}

export function removeDiscoverRoleMarketEntry(
  current: DiscoverRoleShortlistEntry[],
  slug: string,
) {
  return current.filter((entry) => entry.slug !== slug);
}
