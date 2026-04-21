import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ensureInterviewStrategyPlanReady,
  type InterviewStrategyPlanSyncDeps,
} from './interviewStrategyPlanSyncCore';
import type { InterviewStrategyPlanResponse } from './notificationsApiCore';

function createPayload(source: 'default' | 'saved', enabled: boolean): InterviewStrategyPlanResponse {
  return {
    enabled,
    settings: {
      enabled,
      timezoneIana: 'Europe/Warsaw',
      slotDurationMinutes: 60,
      allowedWeekdays: [1, 2, 3, 4, 5],
      workdayStartMinute: 540,
      workdayEndMinute: 1080,
      quietHoursStartMinute: 1290,
      quietHoursEndMinute: 480,
      slotsPerWeek: 5,
      autoFillConfirmedAt: enabled ? '2026-04-18T00:00:00.000Z' : null,
      autoFillStartAt: enabled ? '2026-04-18T00:00:00.000Z' : null,
      filledUntilDateKey: enabled ? '2026-05-17' : null,
      lastGeneratedAt: enabled ? '2026-04-18T00:01:00.000Z' : null,
      updatedAt: null,
      source,
    },
    plan: {
      strategyId: 'strategy-1',
      algorithmVersion: 'interview-strategy-v1',
      generatedAt: null,
      horizonDays: 30,
      timezoneIana: 'Europe/Warsaw',
      filledUntilDateKey: enabled ? '2026-05-17' : null,
      slots: [],
      weeks: [],
    },
  };
}

function createDeps(payloads: InterviewStrategyPlanResponse[]): InterviewStrategyPlanSyncDeps & {
  calls: string[];
} {
  const calls: string[] = [];
  return {
    calls,
    fetchInterviewStrategyPlan: async () => {
      calls.push('fetch');
      return payloads.shift() ?? createPayload('saved', true);
    },
    upsertInterviewStrategySettings: async (input) => {
      calls.push(`upsert:${input.enabled}:${input.timezoneIana}`);
      return { settings: createPayload('saved', input.enabled).settings };
    },
    syncNatalChartCache: async () => {
      calls.push('natal');
      return { status: 'synced', userId: 'user-1', payload: {} };
    },
    resolveTimezoneIana: () => 'Europe/Warsaw',
  };
}

test('interview strategy plan sync auto-enables only default settings', async () => {
  const deps = createDeps([createPayload('default', false), createPayload('saved', true)]);

  const result = await ensureInterviewStrategyPlanReady(deps, { autoEnable: true });

  assert.equal(result.autoEnabled, true);
  assert.equal(result.payload.settings.enabled, true);
  assert.deepEqual(deps.calls, ['fetch', 'natal', 'upsert:true:Europe/Warsaw', 'fetch']);
});

test('interview strategy plan sync respects saved manual opt-out', async () => {
  const deps = createDeps([createPayload('saved', false)]);

  const result = await ensureInterviewStrategyPlanReady(deps, { autoEnable: true });

  assert.equal(result.autoEnabled, false);
  assert.equal(result.payload.settings.enabled, false);
  assert.deepEqual(deps.calls, ['fetch']);
});
