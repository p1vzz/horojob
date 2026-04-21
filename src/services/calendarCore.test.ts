import assert from 'node:assert/strict';
import test from 'node:test';
import type { InterviewStrategyPlan } from '../types/interviewStrategy';
import { createCalendarService, type CalendarLike } from './calendarCore';

function createPlan(): InterviewStrategyPlan {
  const slot1 = {
    id: 'slot-1',
    weekKey: '2026-W14',
    startAt: '2026-03-30T10:00:00.000Z',
    endAt: '2026-03-30T10:30:00.000Z',
    timezoneIana: 'UTC',
    score: 80,
    explanation: 'good',
    calendarNote: 'Use this window for clear answers.',
    breakdown: {
      dailyCareerScore: 80,
      aiSynergyScore: 75,
      weekdayWeight: 10,
      hourWeight: 10,
      conflictPenalty: 0,
    },
  };

  const slot2 = {
    id: 'slot-2',
    weekKey: '2026-W14',
    startAt: '2026-03-30T11:00:00.000Z',
    endAt: '2026-03-30T11:30:00.000Z',
    timezoneIana: 'UTC',
    score: 75,
    explanation: 'ok',
    calendarNote: 'Use this window for calm follow-ups.',
    breakdown: {
      dailyCareerScore: 75,
      aiSynergyScore: 70,
      weekdayWeight: 10,
      hourWeight: 10,
      conflictPenalty: 0,
    },
  };

  const slot3 = {
    id: 'slot-3',
    weekKey: '2026-W14',
    startAt: '2026-03-30T12:00:00.000Z',
    endAt: '2026-03-30T12:30:00.000Z',
    timezoneIana: 'UTC',
    score: 70,
    explanation: 'update needed',
    calendarNote: 'Use this window for concise interview stories.',
    breakdown: {
      dailyCareerScore: 70,
      aiSynergyScore: 65,
      weekdayWeight: 10,
      hourWeight: 10,
      conflictPenalty: 0,
    },
  };

  return {
    strategyId: 'strategy-1',
    algorithmVersion: 'interview-strategy-v1',
    generatedAt: '2026-03-30T09:00:00.000Z',
    horizonDays: 14,
    timezoneIana: 'UTC',
    slots: [slot1, slot2, slot3],
    weeks: [
      {
        weekKey: '2026-W14',
        weekStartAt: '2026-03-30T00:00:00.000Z',
        slots: [slot1, slot2, slot3],
      },
    ],
  };
}

test('calendar core normalizes permissions and limits picker to Horojob and main calendar', async () => {
  let created = false;
  const service = createCalendarService({
    platformOs: 'android',
    getCalendars: async () => {
      const calendars: CalendarLike[] = [
        { id: 'birthdays', title: 'Birthdays', isPrimary: false, allowsModifications: true, source: { name: 'Google', type: 'com.google' } },
        { id: 'tasks', title: 'Google Tasks', isPrimary: false, allowsModifications: true, source: { name: 'Google', type: 'com.google' } },
        { id: 'holidays', title: 'US Holidays', isPrimary: false, allowsModifications: true, source: { name: 'Google', type: 'com.google' } },
        { id: 'events', title: 'Events', isPrimary: true, allowsModifications: true, source: { name: 'Google', type: 'com.google' } },
        { id: 'readonly', title: 'ReadOnly', isPrimary: false, allowsModifications: false, source: { name: 'Other' } },
      ];
      if (created) {
        calendars.push({
          id: 'horojob',
          title: 'Horojob',
          isPrimary: false,
          allowsModifications: true,
          source: { name: 'Horojob', type: 'LOCAL', isLocalAccount: true },
        });
      }
      return calendars;
    },
    getCalendarPermissions: async () => ({ status: 'granted', canAskAgain: true }),
    requestCalendarPermissions: async () => ({ status: 'mystery_status' }),
    createHorojobCalendar: async () => {
      created = true;
      return 'horojob';
    },
    getEvents: async () => [],
    getEvent: async () => null,
    updateEvent: async () => {},
    createEvent: async () => 'event-id',
    deleteEvent: async () => {},
  });

  const granted = await service.getCalendarPermissionState();
  const requested = await service.requestCalendarPermission();
  const options = await service.listWritableCalendarOptions();

  assert.deepEqual(granted, { status: 'granted', canAskAgain: true });
  assert.deepEqual(requested, { status: 'undetermined', canAskAgain: false });
  assert.deepEqual(options, [
    { id: 'horojob', title: 'Horojob', sourceName: 'Horojob', isPrimary: false },
    { id: 'events', title: 'Events', sourceName: 'Google', isPrimary: true },
  ]);
});

test('calendar core resolves local Horojob calendar before main unless preferred main is valid', async () => {
  const calendars = [
    { id: 'a', title: 'A', isPrimary: false, allowsModifications: true, source: { name: 'Google', type: 'com.google' } },
    { id: 'b', title: 'B', isPrimary: true, allowsModifications: true, source: { name: 'Google', type: 'com.google' } },
  ];

  const service = createCalendarService({
    platformOs: 'android',
    getCalendars: async () => [
      ...calendars,
      {
        id: 'local-h',
        title: 'Horojob',
        isPrimary: false,
        allowsModifications: true,
        source: { name: 'Horojob', type: 'LOCAL', isLocalAccount: true },
      },
      {
        id: 'google-h',
        title: 'Horojob',
        isPrimary: false,
        allowsModifications: true,
        source: { name: 'Google', type: 'com.google', isLocalAccount: false },
      },
    ],
    getCalendarPermissions: async () => ({ status: 'granted' }),
    requestCalendarPermissions: async () => ({ status: 'granted' }),
    getEvents: async () => [],
    getEvent: async () => null,
    updateEvent: async () => {},
    createEvent: async () => 'event-id',
    deleteEvent: async () => {},
  });

  assert.equal(await service.resolvePreferredCalendarId(), 'local-h');
  assert.equal(await service.resolvePreferredCalendarId('b'), 'b');
  assert.equal(await service.resolvePreferredCalendarId('google-h'), 'local-h');
});

test('calendar core creates local Horojob when only account-backed Horojob exists', async () => {
  let created = false;
  const service = createCalendarService({
    platformOs: 'android',
    getCalendars: async () => [
      {
        id: 'google-h',
        title: 'Horojob',
        isPrimary: false,
        allowsModifications: true,
        source: { name: 'Google', type: 'com.google', isLocalAccount: false },
      },
      {
        id: 'events',
        title: 'Events',
        isPrimary: true,
        allowsModifications: true,
        source: { name: 'Google', type: 'com.google', isLocalAccount: false },
      },
      ...(created
        ? [
            {
              id: 'local-h',
              title: 'Horojob',
              isPrimary: false,
              allowsModifications: true,
              source: { name: 'Horojob', type: 'LOCAL', isLocalAccount: true },
            },
          ]
        : []),
    ],
    getCalendarPermissions: async () => ({ status: 'granted' }),
    requestCalendarPermissions: async () => ({ status: 'granted' }),
    createHorojobCalendar: async () => {
      created = true;
      return 'local-h';
    },
    getEvents: async () => [],
    getEvent: async () => null,
    updateEvent: async () => {},
    createEvent: async () => 'event-id',
    deleteEvent: async () => {},
  });

  assert.equal(await service.resolvePreferredCalendarId(), 'local-h');
  assert.equal(created, true);
});

test('calendar core loads and sorts busy intervals', async () => {
  const calls: Array<{ ids: string[]; startAt: Date; endAt: Date }> = [];
  const service = createCalendarService({
    platformOs: 'android',
    getCalendars: async () => [{ id: 'w1', title: 'Work', allowsModifications: true }],
    getCalendarPermissions: async () => ({ status: 'granted' }),
    requestCalendarPermissions: async () => ({ status: 'granted' }),
    getEvents: async (ids, startAt, endAt) => {
      calls.push({ ids, startAt, endAt });
      return [
        { id: '2', startDate: '2026-03-30T11:00:00.000Z', endDate: '2026-03-30T12:00:00.000Z' },
        { id: 'bad', startDate: 'bad', endDate: '2026-03-30T12:00:00.000Z' },
        { id: '1', startDate: '2026-03-30T09:00:00.000Z', endDate: '2026-03-30T10:00:00.000Z' },
      ];
    },
    getEvent: async () => null,
    updateEvent: async () => {},
    createEvent: async () => 'event-id',
    deleteEvent: async () => {},
  });

  const intervals = await service.loadCalendarBusyIntervals({
    startAt: new Date('2026-03-30T00:00:00.000Z'),
    endAt: new Date('2026-03-30T23:59:59.000Z'),
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].ids, ['w1']);
  assert.equal(intervals.length, 2);
  assert.ok(intervals[0].startMs < intervals[1].startMs);
});

test('calendar core syncs strategy events with skip/update/create and pruning', async () => {
  const plan = createPlan();
  const updateCalls: string[] = [];
  const createCalls: Array<{ notes: string; availability: string; title: string }> = [];

  const service = createCalendarService({
    platformOs: 'android',
    getCalendars: async () => [],
    getCalendarPermissions: async () => ({ status: 'granted' }),
    requestCalendarPermissions: async () => ({ status: 'granted' }),
    getEvents: async () => [],
    getEvent: async (eventId) => {
      if (eventId === 'evt-keep') {
        return {
          id: 'evt-keep',
          calendarId: 'cal-1',
          startDate: plan.slots[0].startAt,
          endDate: plan.slots[0].endAt,
          notes: 'HOROJOB_INTERVIEW_SLOT:slot-1',
        };
      }
      if (eventId === 'evt-stale') {
        throw new Error('missing');
      }
      if (eventId === 'evt-update') {
        return {
          id: 'evt-update',
          calendarId: 'cal-1',
          startDate: '2026-03-30T12:10:00.000Z',
          endDate: '2026-03-30T12:40:00.000Z',
          notes: 'HOROJOB_INTERVIEW_SLOT:slot-3',
        };
      }
      return null;
    },
    updateEvent: async (eventId, payload) => {
      updateCalls.push(eventId);
      assert.equal(payload.availability, 'free');
      assert.equal(payload.title, 'Interview Timing Reminder');
    },
    createEvent: async (_calendarId, payload) => {
      createCalls.push({
        notes: payload.notes,
        availability: payload.availability,
        title: payload.title,
      });
      return 'evt-created';
    },
    deleteEvent: async () => {},
  });

  const result = await service.syncInterviewStrategyCalendarEvents({
    plan,
    calendarId: 'cal-1',
    existingMap: {
      'slot-1': 'evt-keep',
      'slot-2': 'evt-stale',
      'slot-3': 'evt-update',
      'slot-old': 'evt-old',
    },
  });

  assert.deepEqual(updateCalls, ['evt-keep', 'evt-update']);
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].availability, 'free');
  assert.equal(createCalls[0].title, 'Interview Timing Reminder');
  assert.equal(createCalls[0].notes, 'Use this window for calm follow-ups.');
  assert.doesNotMatch(createCalls[0].notes, /Why:/);
  assert.doesNotMatch(createCalls[0].notes, /HOROJOB/);
  assert.doesNotMatch(createCalls[0].notes, /Score:/);
  assert.equal(result.created, 1);
  assert.equal(result.updated, 2);
  assert.equal(result.skipped, 0);
  assert.equal(result.failed, 0);
  assert.equal(result.recovered, 1);
  assert.equal(result.pruned, 1);
  assert.deepEqual(result.map, {
    'slot-1': 'evt-keep',
    'slot-2': 'evt-created',
    'slot-3': 'evt-update',
  });
});

test('calendar core removes strategy events from local map and marker scan', async () => {
  const plan = createPlan();
  const deleted: string[] = [];
  const getEventById = new Map([
    [
      'evt-mapped',
      {
        id: 'evt-mapped',
        calendarId: 'cal-1',
        notes: 'HOROJOB_INTERVIEW_SLOT:slot-1',
        startDate: plan.slots[0].startAt,
        endDate: plan.slots[0].endAt,
      },
    ],
    [
      'evt-unmarked',
      {
        id: 'evt-unmarked',
        calendarId: 'cal-1',
        notes: 'personal event',
        startDate: plan.slots[1].startAt,
        endDate: plan.slots[1].endAt,
      },
    ],
    [
      'evt-scanned',
      {
        id: 'evt-scanned',
        calendarId: 'cal-2',
        title: 'Interview Timing Reminder',
        notes: 'Use this window for concise interview stories.',
        startDate: plan.slots[2].startAt,
        endDate: plan.slots[2].endAt,
      },
    ],
  ]);

  const service = createCalendarService({
    platformOs: 'android',
    getCalendars: async () => [
      { id: 'cal-1', title: 'Work', allowsModifications: true },
      { id: 'cal-2', title: 'Personal', allowsModifications: true },
      { id: 'read-only', title: 'ReadOnly', allowsModifications: false },
    ],
    getCalendarPermissions: async () => ({ status: 'granted' }),
    requestCalendarPermissions: async () => ({ status: 'granted' }),
    getEvents: async (calendarIds) => {
      assert.deepEqual(calendarIds, ['cal-1', 'cal-2']);
      return [getEventById.get('evt-scanned')!, getEventById.get('evt-unmarked')!];
    },
    getEvent: async (eventId) => getEventById.get(eventId) ?? null,
    updateEvent: async () => {},
    createEvent: async () => 'event-id',
    deleteEvent: async (eventId) => {
      deleted.push(eventId);
    },
  });

  const result = await service.removeInterviewStrategyCalendarEvents({
    plan,
    existingMap: {
      'slot-1': 'evt-mapped',
      'slot-2': 'evt-unmarked',
    },
  });

  assert.deepEqual(deleted.sort(), ['evt-mapped', 'evt-scanned']);
  assert.equal(result.deleted, 2);
  assert.equal(result.failed, 0);
  assert.equal(result.skipped, 1);
  assert.equal(result.scanned, 2);
  assert.deepEqual(result.map, {
    'slot-2': 'evt-unmarked',
  });
});
