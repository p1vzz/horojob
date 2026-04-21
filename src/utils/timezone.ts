export function resolveDeviceTimezoneIana(resolveTimezone: () => string | null = defaultResolveTimezone) {
  try {
    const value = resolveTimezone();
    if (value && value.trim().length > 0) return value.trim();
  } catch {
    // Fallback to product default timezone when runtime cannot resolve IANA.
  }
  return 'America/New_York';
}

function defaultResolveTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
}
