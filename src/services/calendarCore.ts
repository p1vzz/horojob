import type { InterviewStrategyCalendarSyncMap, InterviewStrategyPlan, InterviewStrategySlot } from '../types/interviewStrategy';

const SLOT_MARKER_PREFIX = 'HOROJOB_INTERVIEW_SLOT:';
const INTERVIEW_EVENT_TITLE = 'Interview Timing Reminder';
const HOROJOB_CALENDAR_TITLE = 'Horojob';

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

export type RemoveInterviewStrategyCalendarEventsInput = {
  plan?: InterviewStrategyPlan | null;
  existingMap: InterviewStrategyCalendarSyncMap;
  now?: Date;
};

export type RemoveInterviewStrategyCalendarEventsResult = {
  deleted: number;
  failed: number;
  notFound: number;
  skipped: number;
  scanned: number;
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
    type?: string | null;
    isLocalAccount?: boolean | null;
  } | null;
  isPrimary?: boolean;
  ownerAccount?: string | null;
  isVisible?: boolean;
  isSynced?: boolean;
};

export type CalendarEventLike = {
  id: string;
  calendarId?: string;
  title?: string | null;
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
  availability: 'free';
  alarms: Array<{ relativeOffset: number }>;
};

export type CalendarCoreDeps = {
  platformOs: string;
  getCalendars: () => Promise<CalendarLike[]>;
  getCalendarPermissions: () => Promise<{ status: string; canAskAgain?: boolean }>;
  requestCalendarPermissions: () => Promise<{ status: string; canAskAgain?: boolean }>;
  getDefaultCalendar?: () => Promise<CalendarLike | null>;
  createHorojobCalendar?: () => Promise<string>;
  getEvents: (calendarIds: string[], startAt: Date, endAt: Date) => Promise<CalendarEventLike[]>;
  getEvent: (eventId: string) => Promise<CalendarEventLike | null>;
  updateEvent: (eventId: string, payload: InterviewEventPayload) => Promise<unknown>;
  createEvent: (calendarId: string, payload: InterviewEventPayload) => Promise<string>;
  deleteEvent: (eventId: string) => Promise<unknown>;
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

function buildInterviewEventNotes(slot: InterviewStrategySlot) {
  const note = (slot.calendarNote ?? slot.explanation).replace(/\s+/g, ' ').trim();
  return note;
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

function isRecognizedInterviewEvent(event: CalendarEventLike) {
  if (parseSlotIdFromNotes(event.notes)) return true;
  return event.title === INTERVIEW_EVENT_TITLE;
}

function buildInterviewEventPayload(slot: InterviewStrategySlot): InterviewEventPayload {
  return {
    title: INTERVIEW_EVENT_TITLE,
    notes: buildInterviewEventNotes(slot),
    startDate: new Date(slot.startAt),
    endDate: new Date(slot.endAt),
    timeZone: slot.timezoneIana,
    availability: 'free',
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

function isHorojobCalendar(calendar: CalendarLike) {
  return calendar.title.trim().toLowerCase() === HOROJOB_CALENDAR_TITLE.toLowerCase();
}

function isLocalCalendar(calendar: CalendarLike) {
  return calendar.source?.isLocalAccount === true || calendar.source?.type?.toLowerCase() === 'local';
}

function isSystemCalendar(calendar: CalendarLike) {
  const title = calendar.title.trim().toLowerCase();
  return (
    title.includes('birthday') ||
    title.includes('holiday') ||
    title.includes('tasks') ||
    title.includes('task') ||
    title.includes('reminder')
  );
}

function toWritableCalendarOption(calendar: CalendarLike): WritableCalendarOption {
  return {
    id: calendar.id,
    title: calendar.title,
    sourceName:
      typeof calendar.source?.name === 'string' && calendar.source.name.trim().length > 0
        ? calendar.source.name.trim()
        : null,
    isPrimary: calendar.isPrimary === true,
  };
}

function resolveMainCalendar(calendars: CalendarLike[]) {
  const candidates = calendars.filter((calendar) => !isHorojobCalendar(calendar) && !isSystemCalendar(calendar));
  if (candidates.length === 0) return null;

  const primary = candidates.find((calendar) => calendar.isPrimary === true);
  if (primary) return primary;

  const eventCalendar = candidates.find((calendar) => calendar.title.trim().toLowerCase() === 'events');
  if (eventCalendar) return eventCalendar;

  return candidates[0];
}

function resolveHorojobCalendar(calendars: CalendarLike[], platformOs: string) {
  const horojobCalendars = calendars.filter(isHorojobCalendar);
  if (horojobCalendars.length === 0) return null;

  if (platformOs === 'android') {
    return horojobCalendars.find(isLocalCalendar) ?? null;
  }

  return horojobCalendars[0];
}

async function resolveFocusedCalendars(deps: CalendarCoreDeps) {
  let calendars = filterWritableCalendars(await deps.getCalendars());
  let mainCalendar = resolveMainCalendar(calendars);
  let horojobCalendar = resolveHorojobCalendar(calendars, deps.platformOs);

  if (!horojobCalendar && deps.createHorojobCalendar) {
    try {
      const createdId = await deps.createHorojobCalendar();
      calendars = filterWritableCalendars(await deps.getCalendars());
      mainCalendar = resolveMainCalendar(calendars);
      horojobCalendar =
        calendars.find((calendar) => calendar.id === createdId) ?? resolveHorojobCalendar(calendars, deps.platformOs) ?? {
          id: createdId,
          title: HOROJOB_CALENDAR_TITLE,
          allowsModifications: true,
          isPrimary: false,
        };
    } catch {
      // Fall back to the main writable calendar if the OS/provider rejects calendar creation.
    }
  }

  return { horojobCalendar, mainCalendar, calendars };
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
    if (slotId) {
      if (!index.has(slotId)) index.set(slotId, event);
      continue;
    }

    if (!isRecognizedInterviewEvent(event)) continue;
    const matchingSlot = plan.slots.find((slot) => startsAndEndsMatch(event, slot));
    if (matchingSlot && !index.has(matchingSlot.id)) {
      index.set(matchingSlot.id, event);
    }
  }
  return index;
}

function resolveStrategyEventScanRange(plan: InterviewStrategyPlan | null | undefined, now: Date) {
  const startCandidates =
    plan?.slots.map((slot) => Date.parse(slot.startAt)).filter((value) => Number.isFinite(value)) ?? [];
  const endCandidates =
    plan?.slots.map((slot) => Date.parse(slot.endAt)).filter((value) => Number.isFinite(value)) ?? [];

  if (startCandidates.length > 0 && endCandidates.length > 0) {
    return {
      startAt: new Date(Math.min(...startCandidates) - 24 * 60 * 60 * 1000),
      endAt: new Date(Math.max(...endCandidates) + 24 * 60 * 60 * 1000),
    };
  }

  return {
    startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    endAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
  };
}

export function createCalendarService(deps: CalendarCoreDeps) {
  const listWritableCalendarOptions = async (): Promise<WritableCalendarOption[]> => {
    const { horojobCalendar, mainCalendar } = await resolveFocusedCalendars(deps);
    const options: WritableCalendarOption[] = [];

    if (horojobCalendar) {
      options.push(toWritableCalendarOption(horojobCalendar));
    }
    if (mainCalendar && mainCalendar.id !== horojobCalendar?.id) {
      options.push(toWritableCalendarOption(mainCalendar));
    }

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
    const { horojobCalendar, mainCalendar } = await resolveFocusedCalendars(deps);
    const focusedCalendars = [horojobCalendar, mainCalendar].filter((calendar): calendar is CalendarLike => Boolean(calendar));
    if (focusedCalendars.length === 0) return null;

    if (preferredCalendarId) {
      const preferred = focusedCalendars.find((calendar) => calendar.id === preferredCalendarId);
      if (preferred) return preferred.id;
    }

    return (horojobCalendar ?? mainCalendar ?? focusedCalendars[0]).id;
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

      const payload = buildInterviewEventPayload(slot);

      if (existingEvent) {
        if (
          startsAndEndsMatch(existingEvent, slot) &&
          isRecognizedInterviewEvent(existingEvent) &&
          existingEvent.title === payload.title &&
          existingEvent.notes === payload.notes
        ) {
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

  const removeInterviewStrategyCalendarEvents = async (
    input: RemoveInterviewStrategyCalendarEventsInput
  ): Promise<RemoveInterviewStrategyCalendarEventsResult> => {
    let deleted = 0;
    let failed = 0;
    let notFound = 0;
    let skipped = 0;
    let scanned = 0;

    const remainingMap: InterviewStrategyCalendarSyncMap = { ...input.existingMap };
    const attemptedEventIds = new Set<string>();

    const deleteMarkedEvent = async (eventId: string) => {
      if (attemptedEventIds.has(eventId)) return;
      attemptedEventIds.add(eventId);

      let event: CalendarEventLike | null = null;
      try {
        event = await deps.getEvent(eventId);
      } catch {
        notFound += 1;
        for (const [slotId, mappedEventId] of Object.entries(remainingMap)) {
          if (mappedEventId === eventId) {
            delete remainingMap[slotId];
          }
        }
        return;
      }

      if (!event) {
        notFound += 1;
        for (const [slotId, mappedEventId] of Object.entries(remainingMap)) {
          if (mappedEventId === eventId) {
            delete remainingMap[slotId];
          }
        }
        return;
      }

      if (!isRecognizedInterviewEvent(event)) {
        skipped += 1;
        return;
      }
      const slotId = parseSlotIdFromNotes(event.notes);

      try {
        await deps.deleteEvent(eventId);
        deleted += 1;
        for (const [mappedSlotId, mappedEventId] of Object.entries(remainingMap)) {
          if (mappedEventId === eventId || (slotId && mappedSlotId === slotId)) {
            delete remainingMap[mappedSlotId];
          }
        }
      } catch {
        failed += 1;
      }
    };

    for (const eventId of new Set(Object.values(input.existingMap))) {
      await deleteMarkedEvent(eventId);
    }

    const writableCalendars = filterWritableCalendars(await deps.getCalendars());
    const calendarIds = writableCalendars.map((calendar) => calendar.id);
    if (calendarIds.length > 0) {
      const { startAt, endAt } = resolveStrategyEventScanRange(input.plan, input.now ?? new Date());
      const events = await deps.getEvents(calendarIds, startAt, endAt);
      scanned = events.length;
      for (const event of events) {
        if (!event.id || !isRecognizedInterviewEvent(event)) continue;
        await deleteMarkedEvent(event.id);
      }
    }

    return {
      deleted,
      failed,
      notFound,
      skipped,
      scanned,
      map: remainingMap,
    };
  };

  return {
    listWritableCalendarOptions,
    getCalendarPermissionState,
    requestCalendarPermission,
    resolvePreferredCalendarId,
    loadCalendarBusyIntervals,
    syncInterviewStrategyCalendarEvents,
    removeInterviewStrategyCalendarEvents,
  };
}
