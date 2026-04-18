export type InterviewStrategyAlgorithmVersion = 'interview-strategy-v1';

export type InterviewStrategyPreferences = {
  slotDurationMinutes: 30 | 45 | 60;
  allowedWeekdays: number[];
  workdayStartMinute: number;
  workdayEndMinute: number;
  quietHoursStartMinute: number;
  quietHoursEndMinute: number;
  slotsPerWeek: number;
};

export type InterviewStrategyScoreBreakdown = {
  dailyCareerScore: number;
  aiSynergyScore: number;
  weekdayWeight: number;
  hourWeight: number;
  conflictPenalty: number;
  natalCommunicationScore?: number;
  transitNatalScore?: number;
  careerHouseScore?: number;
  rangeQualityScore?: number;
};

export type InterviewStrategySlot = {
  id: string;
  weekKey: string;
  startAt: string;
  endAt: string;
  timezoneIana: string;
  score: number;
  explanation: string;
  calendarNote?: string;
  breakdown: InterviewStrategyScoreBreakdown;
};

export type InterviewStrategyWeekPlan = {
  weekKey: string;
  weekStartAt: string;
  slots: InterviewStrategySlot[];
};

export type InterviewStrategyPlan = {
  strategyId: string;
  algorithmVersion: InterviewStrategyAlgorithmVersion;
  generatedAt: string | null;
  horizonDays: number;
  timezoneIana: string;
  filledUntilDateKey?: string | null;
  preferences?: InterviewStrategyPreferences;
  baselineScores?: {
    dailyCareerScore: number;
    aiSynergyScore: number;
  };
  slots: InterviewStrategySlot[];
  weeks: InterviewStrategyWeekPlan[];
};

export type InterviewStrategyCalendarSyncMap = Record<string, string>;

export type InterviewStrategyCalendarPermissionCache = {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
  updatedAt: string;
};
