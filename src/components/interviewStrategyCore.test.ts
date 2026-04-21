import assert from 'node:assert/strict';
import test from 'node:test';
import type { InterviewStrategySlot } from '../types/interviewStrategy';
import {
  DEFAULT_INTERVIEW_INSIGHT,
  buildInterviewStrategyInsight,
  clampInterviewStrategyScore,
  formatInterviewStrategySlotTitle,
  formatInterviewStrategyTimeRange,
  resolveInterviewStrategyScoreTone,
  resolveInterviewStrategyTimingLabel,
  toInterviewSlotRows,
} from './interviewStrategyCore';

function createSlot(partial?: Partial<InterviewStrategySlot>): InterviewStrategySlot {
  return {
    id: partial?.id ?? 'slot-1',
    weekKey: partial?.weekKey ?? '2026-W14',
    startAt: partial?.startAt ?? '2026-04-02T10:00:00.000Z',
    endAt: partial?.endAt ?? '2026-04-02T10:45:00.000Z',
    timezoneIana: partial?.timezoneIana ?? 'UTC',
    score: partial?.score ?? 92,
    explanation: partial?.explanation ?? 'A'.repeat(70),
    breakdown: partial?.breakdown ?? {
      dailyCareerScore: 80,
      aiSynergyScore: 84,
      weekdayWeight: 82,
      hourWeight: 86,
      conflictPenalty: 0,
    },
  };
}

test('interview strategy core clamps score bounds', () => {
  assert.equal(clampInterviewStrategyScore(-5), 0);
  assert.equal(clampInterviewStrategyScore(81.6), 82);
  assert.equal(clampInterviewStrategyScore(120), 100);
});

test('interview strategy core formats slot titles against reference date', () => {
  const referenceDate = new Date('2026-04-01T12:00:00.000Z');
  assert.equal(
    formatInterviewStrategySlotTitle('2026-04-01T10:00:00.000Z', 0, { referenceDate }),
    'Today'
  );
  assert.equal(
    formatInterviewStrategySlotTitle('2026-04-02T10:00:00.000Z', 0, { referenceDate }),
    'Tomorrow'
  );
  assert.equal(
    formatInterviewStrategySlotTitle('2026-04-05T10:00:00.000Z', 1, {
      referenceDate,
      formatDateLabel: () => 'Sun, Apr 5',
    }),
    'Sun, Apr 5'
  );
  assert.equal(formatInterviewStrategySlotTitle('invalid', 2, { referenceDate }), 'Slot 3');
});

test('interview strategy core formats time range and slot rows', () => {
  const row = toInterviewSlotRows(
    [createSlot({ score: 81.6 })],
    {
      formatTimeLabel: (value) => value.toISOString().slice(11, 16),
      formatDateLabel: () => 'Thu, Apr 2',
      referenceDate: new Date('2026-04-01T12:00:00.000Z'),
    }
  )[0];

  assert.equal(
    formatInterviewStrategyTimeRange('2026-04-02T10:00:00.000Z', '2026-04-02T10:45:00.000Z', {
      formatTimeLabel: (value) => value.toISOString().slice(11, 16),
    }),
    '10:00 - 10:45'
  );
  assert.equal(formatInterviewStrategyTimeRange('invalid', '2026-04-02T10:45:00.000Z'), '--:-- - --:--');
  assert.deepEqual(row, {
    id: 'slot-1',
    title: 'Tomorrow',
    timeRange: '10:00 - 10:45',
    score: 82,
  });
});

test('interview strategy core builds default or derived insight text', () => {
  assert.equal(buildInterviewStrategyInsight(undefined), DEFAULT_INTERVIEW_INSIGHT);

  const explicit = createSlot({ explanation: 'B'.repeat(72) });
  assert.equal(buildInterviewStrategyInsight(explicit), 'B'.repeat(72));

  const derived = buildInterviewStrategyInsight(
    createSlot({
      explanation: 'short text',
      score: 88,
      breakdown: {
        dailyCareerScore: 80,
        aiSynergyScore: 77,
        weekdayWeight: 60,
        hourWeight: 81,
        conflictPenalty: 0,
      },
    }),
    {
      referenceDate: new Date('2026-04-01T12:00:00.000Z'),
      formatTimeLabel: (value) => value.toISOString().slice(11, 16),
    }
  );

  assert.match(derived, /^Tomorrow \(10:00 - 10:45\) looks supportive for interviews:/);
  assert.match(derived, /career momentum is elevated and AI synergy is supportive\./);
});

test('interview strategy core resolves score tone thresholds', () => {
  assert.deepEqual(resolveInterviewStrategyScoreTone(82, { isTopPick: true }), {
    accent: '#38CC88',
    border: 'rgba(56,204,136,0.32)',
    background: 'rgba(56,204,136,0.08)',
  });
  assert.deepEqual(resolveInterviewStrategyScoreTone(95), {
    accent: '#C9A84C',
    border: 'rgba(201,168,76,0.3)',
    background: 'rgba(201,168,76,0.075)',
  });
  assert.deepEqual(resolveInterviewStrategyScoreTone(82), {
    accent: '#D9C06B',
    border: 'rgba(217,192,107,0.24)',
    background: 'rgba(217,192,107,0.06)',
  });
  assert.deepEqual(resolveInterviewStrategyScoreTone(70), {
    accent: '#CFC5A7',
    border: 'rgba(207,197,167,0.2)',
    background: 'rgba(255,255,255,0.035)',
  });
});

test('interview strategy core resolves qualitative timing labels', () => {
  assert.equal(resolveInterviewStrategyTimingLabel(95, { isTopPick: true }), 'Best');
  assert.equal(resolveInterviewStrategyTimingLabel(95), 'Strong');
  assert.equal(resolveInterviewStrategyTimingLabel(82), 'Favorable');
  assert.equal(resolveInterviewStrategyTimingLabel(70), 'Supportive');
});
