import type { Quest, QuestOccurrence } from './types';
import { addWallDays, getZonedParts, wallTimeToUtc, zonedDateKey } from './time';

export interface RecurrenceGenerationOptions {
  readonly from: string;
  readonly to: string;
  readonly now: string;
  readonly createId: () => string;
  readonly maximumOccurrences?: number;
}

function matchesFrequency(
  frequency: NonNullable<Quest['recurrence']>['frequency'],
  interval: number,
  dayOffset: number,
  weekday: number,
  weekdays: readonly number[],
): boolean {
  if (frequency === 'daily') return dayOffset % interval === 0;
  if (frequency === 'weekly') return dayOffset % (7 * interval) === 0;
  return weekdays.includes(weekday);
}

export function generateQuestOccurrences(
  quest: Quest,
  options: RecurrenceGenerationOptions,
): readonly QuestOccurrence[] {
  if (!quest.recurrence) return [];
  const seed = quest.scheduledAt ?? quest.dueAt ?? quest.createdAt;
  const timezone = quest.recurrence.timezone;
  const seedParts = getZonedParts(seed, timezone);
  const maximumOccurrences = options.maximumOccurrences ?? 64;
  const occurrences: QuestOccurrence[] = [];

  for (let dayOffset = 0; dayOffset <= 366 && occurrences.length < maximumOccurrences; dayOffset += 1) {
    const wall = addWallDays(seedParts, dayOffset);
    const weekday = new Date(Date.UTC(wall.year, wall.month - 1, wall.day)).getUTCDay();
    if (!matchesFrequency(
      quest.recurrence.frequency,
      quest.recurrence.interval,
      dayOffset,
      weekday,
      quest.recurrence.weekdays,
    )) continue;

    const scheduledFor = wallTimeToUtc(wall, timezone);
    if (scheduledFor < options.from) continue;
    if (scheduledFor > options.to) break;
    if (quest.recurrence.endsAt && scheduledFor > quest.recurrence.endsAt) break;
    const occurrenceKey = `${quest.id}:${zonedDateKey(scheduledFor, timezone)}`;
    occurrences.push({
      id: options.createId(),
      questId: quest.id,
      occurrenceKey,
      scheduledFor,
      status: 'active',
      completedAt: null,
      createdAt: options.now,
    });
  }
  return occurrences;
}

