import { describe, expect, it } from 'vitest';

import { generateQuestOccurrences } from './recurrence';
import type { Quest } from './types';

const recurringQuest: Quest = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Morning ritual',
  description: null,
  type: 'recurring',
  difficulty: 'normal',
  status: 'active',
  createdAt: '2026-10-31T12:00:00.000Z',
  updatedAt: '2026-10-31T12:00:00.000Z',
  dueAt: null,
  dueTimezone: null,
  scheduledAt: '2026-10-31T13:00:00.000Z',
  completedAt: null,
  priority: null,
  notes: null,
  parentQuestId: null,
  questlineId: null,
  skillIds: [],
  achievementIds: [],
  xpReward: null,
  rupeeReward: null,
  recurrence: {
    frequency: 'daily',
    interval: 1,
    weekdays: [],
    endsAt: '2026-11-03T23:00:00.000Z',
    timezone: 'America/New_York',
  },
  deletedAt: null,
};

describe('recurrence generation', () => {
  it('preserves wall time across daylight-saving changes and remains bounded', () => {
    let id = 0;
    const occurrences = generateQuestOccurrences(recurringQuest, {
      from: '2026-10-31T00:00:00.000Z',
      to: '2026-11-04T00:00:00.000Z',
      now: '2026-10-31T00:00:00.000Z',
      createId: () => `occurrence-${id += 1}`,
      maximumOccurrences: 4,
    });
    expect(occurrences).toHaveLength(4);
    expect(occurrences.map((item) => item.scheduledFor)).toEqual([
      '2026-10-31T13:00:00.000Z',
      '2026-11-01T14:00:00.000Z',
      '2026-11-02T14:00:00.000Z',
      '2026-11-03T14:00:00.000Z',
    ]);
    expect(new Set(occurrences.map((item) => item.occurrenceKey)).size).toBe(4);
  });
});

