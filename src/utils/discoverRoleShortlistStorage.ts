import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  mergeDiscoverRoleShortlistEntries,
  parseDiscoverRoleShortlistByUser,
  removeDiscoverRoleShortlistEntry,
  selectDiscoverRoleShortlistEntriesForSync,
  upsertDiscoverRoleShortlistEntry,
  type DiscoverRoleShortlistEntry,
  type DiscoverRoleShortlistInput,
} from './discoverRoleShortlistStorageCore';

const DISCOVER_ROLE_SHORTLIST_KEY_BY_USER = 'discover-roles:shortlist:v1-by-user';

export type { DiscoverRoleShortlistEntry, DiscoverRoleShortlistInput };
export { mergeDiscoverRoleShortlistEntries, selectDiscoverRoleShortlistEntriesForSync };

export async function loadDiscoverRoleShortlistForUser(userId: string) {
  const raw = await AsyncStorage.getItem(DISCOVER_ROLE_SHORTLIST_KEY_BY_USER);
  const byUser = parseDiscoverRoleShortlistByUser(raw);
  return mergeDiscoverRoleShortlistEntries(byUser[userId] ?? []);
}

export async function saveDiscoverRoleShortlistEntryForUser(
  userId: string,
  entry: DiscoverRoleShortlistInput,
) {
  const raw = await AsyncStorage.getItem(DISCOVER_ROLE_SHORTLIST_KEY_BY_USER);
  const byUser = parseDiscoverRoleShortlistByUser(raw);
  const updated = upsertDiscoverRoleShortlistEntry(byUser[userId] ?? [], entry, new Date().toISOString());
  byUser[userId] = updated;
  await AsyncStorage.setItem(DISCOVER_ROLE_SHORTLIST_KEY_BY_USER, JSON.stringify(byUser));
  return updated;
}

export async function removeDiscoverRoleShortlistEntryForUser(userId: string, slug: string) {
  const raw = await AsyncStorage.getItem(DISCOVER_ROLE_SHORTLIST_KEY_BY_USER);
  const byUser = parseDiscoverRoleShortlistByUser(raw);
  const updated = removeDiscoverRoleShortlistEntry(byUser[userId] ?? [], slug);
  if (updated.length > 0) {
    byUser[userId] = updated;
  } else {
    delete byUser[userId];
  }

  if (Object.keys(byUser).length === 0) {
    await AsyncStorage.removeItem(DISCOVER_ROLE_SHORTLIST_KEY_BY_USER);
  } else {
    await AsyncStorage.setItem(DISCOVER_ROLE_SHORTLIST_KEY_BY_USER, JSON.stringify(byUser));
  }
  return updated;
}

export async function replaceDiscoverRoleShortlistForUser(userId: string, entries: DiscoverRoleShortlistEntry[]) {
  const raw = await AsyncStorage.getItem(DISCOVER_ROLE_SHORTLIST_KEY_BY_USER);
  const byUser = parseDiscoverRoleShortlistByUser(raw);
  const updated = mergeDiscoverRoleShortlistEntries(entries);
  if (updated.length > 0) {
    byUser[userId] = updated;
    await AsyncStorage.setItem(DISCOVER_ROLE_SHORTLIST_KEY_BY_USER, JSON.stringify(byUser));
  } else {
    delete byUser[userId];
    if (Object.keys(byUser).length === 0) {
      await AsyncStorage.removeItem(DISCOVER_ROLE_SHORTLIST_KEY_BY_USER);
    } else {
      await AsyncStorage.setItem(DISCOVER_ROLE_SHORTLIST_KEY_BY_USER, JSON.stringify(byUser));
    }
  }
  return updated;
}
