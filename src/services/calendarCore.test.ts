import assert from 'node:assert/strict';
import test from 'node:test';
import type { InterviewStrategyPlan } from '../types/interviewStrategy';
import { createCalendarService } from './calendarCore';

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

test('calendar core normalizes permissions and sorts writable calendar options', async () => {
  const service = createCalendarService({
    platformOs: 'android',
    getCalendars: async () => [
      { id: '2', title: 'Work', isPrimary: false, allowsModifications: true, source: { name: 'Google' } },
      { id: '1', title: 'Main', isPrimary: true, allowsModifications: true, source: { name: 'iCloud' } },
      { id: '3', title: 'ReadOnly', isPrimary: false, allowsModifications: false, source: { name: 'Other' } },
    ],
    getCalendarPermissions: async () => ({ status: 'granted', canAskAgain: true }),
    requestCalendarPermissions: async () => ({ status: 'mystery_status' }),
    getEvents: async () => [],
    getEvent: async () => null,
    updateEvent: async () => {},
    createEvent: async () => 'event-id',
  });

  const granted = await service.getCalendarPermissionState();
  const requested = await service.requestCalendarPermission();
  const options = await service.listWritableCalendarOptions();

  assert.deepEqual(granted, { status: 'granted', canAskAgain: true });
  assert.deepEqual(requested, { status: 'undetermined', canAskAgain: false });
  assert.deepEqual(options, [
    { id: '1', title: 'Main', sourceName: 'iCloud', isPrimary: true },
    { id: '2', title: 'Work', sourceName: 'Google', isPrimary: false },
  ]);
});

test('calendar core resolves preferred/default/primary calendar id', async () => {
  const calendars = [
    { id: 'a', title: 'A', isPrimary: false, allowsModifications: true },
    { id: 'b', title: 'B', isPrimary: true, allowsModifications: true },
  ];

  const iosService = createCalendarService({
    platformOs: 'ios',
    getCalendars: async () => calendars,
    getCalendarPermissions: async () => ({ status: 'granted' }),
    requestCalendarPermissions: async () => ({ status: 'granted' }),
    getDefaultCalendar: async () => ({ id: 'a', title: 'A' }),
    getEvents: async () => [],
    getEvent: async () => null,
    updateEvent: async () => {},
    createEvent: async () => 'event-id',
  });

  assert.equal(await iosService.resolvePreferredCalendarId('b'), 'b');
  assert.equal(await iosService.resolvePreferredCalendarId(), 'a');

  const androidService = createCalendarService({
    platformOs: 'android',
    getCalendars: async () => calendars,
    getCalendarPermissions: async () => ({ status: 'granted' }),
    requestCalendarPermissions: async () => ({ status: 'granted' }),
    getEvents: async () => [],
    getEvent: async () => null,
    updateEvent: async () => {},
    createEvent: async () => 'event-id',
  });

  assert.equal(await androidService.resolvePreferredCalendarId(), 'b');
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
  const createCalls: string[] = [];

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
    updateEvent: async (eventId) => {
      updateCalls.push(eventId);
    },
    createEvent: async (_calendarId, payload) => {
      createCalls.push(payload.notes);
      return 'evt-created';
    },
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

  assert.deepEqual(updateCalls, ['evt-update']);
  assert.equal(createCalls.length, 1);
  assert.match(createCalls[0], /^Why:Use this window for calm follow-ups\./);
  assert.equal(result.created, 1);
  assert.equal(result.updated, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.recovered, 1);
  assert.equal(result.pruned, 1);
  assert.deepEqual(result.map, {
    'slot-1': 'evt-keep',
    'slot-2': 'evt-created',
    'slot-3': 'evt-update',
  });
});
