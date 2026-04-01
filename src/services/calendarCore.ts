import type { InterviewStrategyCalendarSyncMap, InterviewStrategyPlan, InterviewStrategySlot } from '../types/interviewStrategy';

const SLOT_MARKER_PREFIX = 'HOROJOB_INTERVIEW_SLOT:';
const STRATEGY_MARKER_PREFIX = 'HOROJOB_INTERVIEW_STRATEGY:';

export type CalendarPermissionState = {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
};

export type CalendarBusyInterval = {
  startMs: number;
  endMs: number;
};

export type SyncInterviewStrategyCalendarEventsInput = {
  plan: InterviewStrategyPlan;
  calendarId: string;
  existingMap: InterviewStrategyCalendarSyncMap;
};

export type SyncInterviewStrategyCalendarEventsResult = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  recovered: number;
  pruned: number;
  map: InterviewStrategyCalendarSyncMap;
};

export type WritableCalendarOption = {
  id: string;
  title: string;
  sourceName: string | null;
  isPrimary: boolean;
};

export type CalendarLike = {
  id: string;
  title: string;
  allowsModifications?: boolean;
  source?: {
    name?: string | null;
  } | null;
  isPrimary?: boolean;
};

export type CalendarEventLike = {
  id: string;
  calendarId?: string;
  notes?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
};

type InterviewEventPayload = {
  title: string;
  notes: string;
  startDate: Date;
  endDate: Date;
  timeZone: string;
  alarms: Array<{ relativeOffset: number }>;
};

export type CalendarCoreDeps = {
  platformOs: string;
  getCalendars: () => Promise<CalendarLike[]>;
  getCalendarPermissions: () => Promise<{ status: string; canAskAgain?: boolean }>;
  requestCalendarPermissions: () => Promise<{ status: string; canAskAgain?: boolean }>;
  getDefaultCalendar?: () => Promise<CalendarLike | null>;
  getEvents: (calendarIds: string[], startAt: Date, endAt: Date) => Promise<CalendarEventLike[]>;
  getEvent: (eventId: string) => Promise<CalendarEventLike | null>;
  updateEvent: (eventId: string, payload: InterviewEventPayload) => Promise<unknown>;
  createEvent: (calendarId: string, payload: InterviewEventPayload) => Promise<string>;
};

function normalizePermissionResult(permission: { status: string; canAskAgain?: boolean }): CalendarPermissionState {
  if (permission.status === 'granted') {
    return {
      status: 'granted',
      canAskAgain: Boolean(permission.canAskAgain),
    };
  }

  if (permission.status === 'denied') {
    return {
      status: 'denied',
      canAskAgain: Boolean(permission.canAskAgain),
    };
  }

  return {
    status: 'undetermined',
    canAskAgain: Boolean(permission.canAskAgain),
  };
}

function parseSlotIdFromNotes(notes: string | null | undefined) {
  if (!notes) return null;
  const lines = notes.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith(SLOT_MARKER_PREFIX)) {
      const slotId = line.slice(SLOT_MARKER_PREFIX.length).trim();
      if (slotId.length > 0) return slotId;
    }
  }
  return null;
}

function buildInterviewEventNotes(slot: InterviewStrategySlot, plan: InterviewStrategyPlan) {
  return [
    `${SLOT_MARKER_PREFIX}${slot.id}`,
    `${STRATEGY_MARKER_PREFIX}${plan.strategyId}`,
    `Algorithm:${plan.algorithmVersion}`,
    `Score:${slot.score}`,
    `GeneratedAt:${plan.generatedAt}`,
  ].join('\n');
}

function toTs(dateLike: string | Date | null | undefined) {
  if (!dateLike) return Number.NaN;
  if (dateLike instanceof Date) return dateLike.getTime();
  return Date.parse(dateLike);
}

function startsAndEndsMatch(event: CalendarEventLike, slot: InterviewStrategySlot) {
  const eventStartTs = toTs(event.startDate);
  const eventEndTs = toTs(event.endDate);
  const slotStartTs = Date.parse(slot.startAt);
  const slotEndTs = Date.parse(slot.endAt);
  if (!Number.isFinite(eventStartTs) || !Number.isFinite(eventEndTs)) return false;
  if (!Number.isFinite(slotStartTs) || !Number.isFinite(slotEndTs)) return false;
  const oneMinuteMs = 60_000;
  return Math.abs(eventStartTs - slotStartTs) < oneMinuteMs && Math.abs(eventEndTs - slotEndTs) < oneMinuteMs;
}

function buildInterviewEventPayload(slot: InterviewStrategySlot, plan: InterviewStrategyPlan): InterviewEventPayload {
  return {
    title: 'Interview Focus Block',
    notes: buildInterviewEventNotes(slot, plan),
    startDate: new Date(slot.startAt),
    endDate: new Date(slot.endAt),
    timeZone: slot.timezoneIana,
    alarms: [{ relativeOffset: -30 }],
  };
}

function scopeExistingMapToPlan(existingMap: InterviewStrategyCalendarSyncMap, plan: InterviewStrategyPlan) {
  const slotIds = new Set(plan.slots.map((slot) => slot.id));
  const scopedMap: InterviewStrategyCalendarSyncMap = {};
  let pruned = 0;
  for (const [slotId, eventId] of Object.entries(existingMap)) {
    if (!slotIds.has(slotId)) {
      pruned += 1;
      continue;
    }
    scopedMap[slotId] = eventId;
  }
  return { scopedMap, pruned };
}

function filterWritableCalendars(calendars: CalendarLike[]) {
  return calendars.filter((calendar) => calendar.allowsModifications !== false);
}

async function indexStrategyEventsBySlotId(
  deps: CalendarCoreDeps,
  plan: InterviewStrategyPlan,
  calendarId: string
) {
  if (plan.slots.length === 0) return new Map<string, CalendarEventLike>();

  const startCandidates = plan.slots.map((slot) => Date.parse(slot.startAt)).filter((value) => Number.isFinite(value));
  const endCandidates = plan.slots.map((slot) => Date.parse(slot.endAt)).filter((value) => Number.isFinite(value));
  if (startCandidates.length === 0 || endCandidates.length === 0) {
    return new Map<string, CalendarEventLike>();
  }

  const startAt = new Date(Math.min(...startCandidates) - 2 * 60 * 60 * 1000);
  const endAt = new Date(Math.max(...endCandidates) + 2 * 60 * 60 * 1000);
  const events = await deps.getEvents([calendarId], startAt, endAt);

  const index = new Map<string, CalendarEventLike>();
  for (const event of events) {
    const slotId = parseSlotIdFromNotes(event.notes);
    if (!slotId || index.has(slotId)) continue;
    index.set(slotId, event);
  }
  return index;
}

export function createCalendarService(deps: CalendarCoreDeps) {
  const listWritableCalendarOptions = async (): Promise<WritableCalendarOption[]> => {
    const calendars = filterWritableCalendars(await deps.getCalendars());
    const options = calendars.map((calendar) => ({
      id: calendar.id,
      title: calendar.title,
      sourceName:
        typeof calendar.source?.name === 'string' && calendar.source.name.trim().length > 0
          ? calendar.source.name.trim()
          : null,
      isPrimary: calendar.isPrimary === true,
    }));

    options.sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
      return left.title.localeCompare(right.title);
    });

    return options;
  };

  const getCalendarPermissionState = async (): Promise<CalendarPermissionState> => {
    const permission = await deps.getCalendarPermissions();
    return normalizePermissionResult(permission);
  };

  const requestCalendarPermission = async (): Promise<CalendarPermissionState> => {
    const permission = await deps.requestCalendarPermissions();
    return normalizePermissionResult(permission);
  };

  const resolvePreferredCalendarId = async (preferredCalendarId?: string | null) => {
    const writableCalendars = filterWritableCalendars(await deps.getCalendars());
    if (writableCalendars.length === 0) return null;

    if (preferredCalendarId) {
      const preferred = writableCalendars.find((calendar) => calendar.id === preferredCalendarId);
      if (preferred) return preferred.id;
    }

    if (deps.platformOs === 'ios' && deps.getDefaultCalendar) {
      try {
        const defaultCalendar = await deps.getDefaultCalendar();
        if (defaultCalendar && writableCalendars.some((calendar) => calendar.id === defaultCalendar.id)) {
          return defaultCalendar.id;
        }
      } catch {
        // Fall back to writable calendar list.
      }
    }

    const primary = writableCalendars.find((calendar) => calendar.isPrimary === true);
    return (primary ?? writableCalendars[0]).id;
  };

  const loadCalendarBusyIntervals = async (input: {
    startAt: Date;
    endAt: Date;
    calendarIds?: string[];
  }): Promise<CalendarBusyInterval[]> => {
    const explicitCalendarIds = input.calendarIds?.filter((value) => value.trim().length > 0) ?? [];
    let calendarIds = explicitCalendarIds;
    if (calendarIds.length === 0) {
      const writableCalendars = filterWritableCalendars(await deps.getCalendars());
      calendarIds = writableCalendars.map((calendar) => calendar.id);
    }

    if (calendarIds.length === 0) return [];

    const events = await deps.getEvents(calendarIds, input.startAt, input.endAt);
    const intervals = events
      .map((event) => {
        const startMs = toTs(event.startDate);
        const endMs = toTs(event.endDate);
        return { startMs, endMs };
      })
      .filter((interval) => Number.isFinite(interval.startMs) && Number.isFinite(interval.endMs) && interval.endMs > interval.startMs)
      .sort((left, right) => left.startMs - right.startMs);

    return intervals;
  };

  const syncInterviewStrategyCalendarEvents = async (
    input: SyncInterviewStrategyCalendarEventsInput
  ): Promise<SyncInterviewStrategyCalendarEventsResult> => {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let recovered = 0;

    const nextMap: InterviewStrategyCalendarSyncMap = {};
    const { scopedMap, pruned } = scopeExistingMapToPlan(input.existingMap, input.plan);
    if (input.plan.slots.length === 0) {
      return {
        created,
        updated,
        skipped,
        failed,
        recovered,
        pruned,
        map: nextMap,
      };
    }

    const eventsBySlotId = await indexStrategyEventsBySlotId(deps, input.plan, input.calendarId);

    for (const slot of input.plan.slots) {
      const mappedEventId = scopedMap[slot.id];
      let existingEvent: CalendarEventLike | null = null;
      let staleMappingEncountered = false;

      if (mappedEventId) {
        try {
          const fromMapping = await deps.getEvent(mappedEventId);
          if (fromMapping?.id && fromMapping.calendarId === input.calendarId) {
            existingEvent = fromMapping;
          } else {
            staleMappingEncountered = true;
          }
        } catch {
          staleMappingEncountered = true;
          // Continue with note marker lookup fallback.
        }
      }

      if (!existingEvent) {
        const fromMarker = eventsBySlotId.get(slot.id);
        if (fromMarker) {
          existingEvent = fromMarker;
          if (mappedEventId !== fromMarker.id) {
            recovered += 1;
          }
        }
      }

      const payload = buildInterviewEventPayload(slot, input.plan);

      if (existingEvent) {
        const hasMarker = parseSlotIdFromNotes(existingEvent.notes) === slot.id;
        if (startsAndEndsMatch(existingEvent, slot) && hasMarker) {
          skipped += 1;
          nextMap[slot.id] = existingEvent.id;
          continue;
        }

        try {
          await deps.updateEvent(existingEvent.id, payload);
          updated += 1;
          nextMap[slot.id] = existingEvent.id;
          continue;
        } catch {
          // Fall through to create path if update failed.
        }
      }

      try {
        const createdEventId = await deps.createEvent(input.calendarId, payload);
        created += 1;
        if (staleMappingEncountered) {
          recovered += 1;
        }
        nextMap[slot.id] = createdEventId;
      } catch {
        failed += 1;
      }
    }

    return {
      created,
      updated,
      skipped,
      failed,
      recovered,
      pruned,
      map: nextMap,
    };
  };

  return {
    listWritableCalendarOptions,
    getCalendarPermissionState,
    requestCalendarPermission,
    resolvePreferredCalendarId,
    loadCalendarBusyIntervals,
    syncInterviewStrategyCalendarEvents,
  };
}
