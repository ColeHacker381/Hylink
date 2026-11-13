import type { QuestDomainEvent, QuestEventType } from './events';
import { QuestNotFoundError, QuestStateError, QuestValidationError } from './errors';
import { filterQuestItems } from './filtering';
import { generateQuestOccurrences } from './recurrence';
import type { QuestRepository } from './repository';
import type {
  CreateQuestInput,
  Quest,
  QuestDashboard,
  QuestFilters,
  QuestListItem,
  QuestOccurrence,
  RecurrenceRule,
  UpdateQuestInput,
} from './types';

export interface QuestServiceDependencies {
  readonly repository: QuestRepository;
  readonly now?: () => string;
  readonly createId?: () => string;
  readonly timezone?: () => string;
}

function uuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function assertIso(value: string | null | undefined, label: string): void {
  if (value && Number.isNaN(Date.parse(value))) throw new QuestValidationError(`${label} must be a valid ISO 8601 timestamp.`);
}

function validateRecurrence(recurrence: RecurrenceRule | null | undefined): void {
  if (!recurrence) return;
  if (recurrence.interval < 1 || !Number.isInteger(recurrence.interval)) {
    throw new QuestValidationError('Recurrence interval must be a positive integer.');
  }
  if (recurrence.frequency === 'weekdays') {
    if (recurrence.weekdays.length === 0 || recurrence.weekdays.some((day) => day < 0 || day > 6)) {
      throw new QuestValidationError('Selected-weekday recurrence requires valid weekdays.');
    }
  }
  assertIso(recurrence.endsAt, 'Recurrence end');
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: recurrence.timezone }).format();
  } catch {
    throw new QuestValidationError('Recurrence timezone must be a valid IANA timezone.');
  }
}

export class QuestService {
  private readonly repository: QuestRepository;
  private readonly now: () => string;
  private readonly createId: () => string;
  private readonly timezone: () => string;

  constructor(dependencies: QuestServiceDependencies) {
    this.repository = dependencies.repository;
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.createId = dependencies.createId ?? uuidV4;
    this.timezone = dependencies.timezone ?? (() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  }

  async createQuest(input: CreateQuestInput): Promise<Quest> {
    const title = input.title.trim();
    if (!title) throw new QuestValidationError('Quest title is required.');
    if (title.length > 120) throw new QuestValidationError('Quest title must be 120 characters or fewer.');
    assertIso(input.dueAt, 'Due date');
    assertIso(input.scheduledAt, 'Scheduled time');
    validateRecurrence(input.recurrence);
    const timestamp = this.now();
    const recurrence = input.recurrence ?? null;
    const quest: Quest = {
      id: this.createId(),
      title,
      description: optionalText(input.description),
      type: recurrence ? 'recurring' : (input.type ?? 'side'),
      difficulty: input.difficulty ?? 'normal',
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
      dueAt: input.dueAt ?? null,
      dueTimezone: input.dueTimezone ?? (input.dueAt ? this.timezone() : null),
      scheduledAt: input.scheduledAt ?? null,
      completedAt: null,
      priority: input.priority ?? null,
      notes: optionalText(input.notes),
      parentQuestId: input.parentQuestId ?? null,
      questlineId: input.questlineId ?? null,
      skillIds: [...(input.skillIds ?? [])],
      achievementIds: [...(input.achievementIds ?? [])],
      xpReward: input.xpReward ?? null,
      rupeeReward: input.rupeeReward ?? null,
      recurrence,
      deletedAt: null,
    };
    return this.repository.createQuest(quest, this.createEvent('quest.created', quest.id, null, timestamp, { title }));
  }

  async getQuest(id: string): Promise<Quest> {
    const quest = await this.repository.getQuest(id);
    if (!quest) throw new QuestNotFoundError(id);
    return quest;
  }

  async listQuests(filters: QuestFilters = {}): Promise<readonly QuestListItem[]> {
    const now = filters.now ?? this.now();
    const timezone = filters.timezone ?? this.timezone();
    const quests = await this.repository.listQuests();
    const items: QuestListItem[] = [];
    const horizonEnd = new Date(Date.parse(now) + 60 * 86_400_000).toISOString();
    const horizonStart = new Date(Date.parse(now) - 7 * 86_400_000).toISOString();

    for (const quest of quests) {
      if (quest.recurrence && quest.status === 'active') {
        const generated = generateQuestOccurrences(quest, {
          from: horizonStart,
          to: horizonEnd,
          now,
          createId: this.createId,
        });
        await this.repository.saveOccurrences(generated);
        const occurrences = await this.repository.listOccurrences(quest.id, horizonStart, horizonEnd);
        items.push(...occurrences.map((occurrence) => ({ quest, occurrence })));
      } else {
        items.push({ quest, occurrence: null });
      }
    }
    return filterQuestItems(items, { ...filters, now, timezone });
  }

  async updateQuest(id: string, input: UpdateQuestInput): Promise<Quest> {
    const current = await this.getQuest(id);
    if (current.status === 'archived') throw new QuestStateError('Archived quests must be reopened before editing.');
    if (input.title !== undefined && !input.title.trim()) throw new QuestValidationError('Quest title is required.');
    assertIso(input.dueAt, 'Due date');
    assertIso(input.scheduledAt, 'Scheduled time');
    validateRecurrence(input.recurrence);
    const timestamp = this.now();
    const recurrence = input.recurrence === undefined ? current.recurrence : input.recurrence;
    const updated: Quest = {
      ...current,
      title: input.title === undefined ? current.title : input.title.trim(),
      description: input.description === undefined ? current.description : optionalText(input.description),
      type: recurrence ? 'recurring' : (input.type ?? current.type),
      difficulty: input.difficulty ?? current.difficulty,
      dueAt: input.dueAt === undefined ? current.dueAt : input.dueAt,
      dueTimezone: input.dueTimezone === undefined ? current.dueTimezone : input.dueTimezone,
      scheduledAt: input.scheduledAt === undefined ? current.scheduledAt : input.scheduledAt,
      priority: input.priority === undefined ? current.priority : input.priority,
      notes: input.notes === undefined ? current.notes : optionalText(input.notes),
      parentQuestId: input.parentQuestId === undefined ? current.parentQuestId : input.parentQuestId,
      questlineId: input.questlineId === undefined ? current.questlineId : input.questlineId,
      skillIds: input.skillIds === undefined ? current.skillIds : [...input.skillIds],
      achievementIds: input.achievementIds === undefined ? current.achievementIds : [...input.achievementIds],
      xpReward: input.xpReward === undefined ? current.xpReward : input.xpReward,
      rupeeReward: input.rupeeReward === undefined ? current.rupeeReward : input.rupeeReward,
      recurrence,
      updatedAt: timestamp,
    };
    return this.repository.updateQuest(updated, this.createEvent('quest.updated', id, null, timestamp, { fields: Object.keys(input) }));
  }

  async completeQuest(id: string, occurrenceId?: string): Promise<Quest> {
    const quest = await this.getQuest(id);
    this.assertActionable(quest);
    const occurrence = occurrenceId ? await this.requireOccurrence(occurrenceId, quest.id) : null;
    if (quest.recurrence && !occurrence) throw new QuestValidationError('A recurring quest occurrence is required.');
    if (occurrence?.status === 'completed' || (!occurrence && quest.status === 'completed')) return quest;
    const timestamp = this.now();
    const completedQuest: Quest = occurrence
      ? { ...quest, updatedAt: timestamp }
      : { ...quest, status: 'completed', completedAt: timestamp, updatedAt: timestamp };
    const completedOccurrence = occurrence
      ? { ...occurrence, status: 'completed' as const, completedAt: timestamp }
      : null;
    const result = await this.repository.completeQuest(
      completedQuest,
      this.createEvent('quest.completed', id, occurrence?.id ?? null, timestamp, { occurrenceKey: occurrence?.occurrenceKey ?? null }),
      completedOccurrence,
    );
    return result.quest;
  }

  async reopenQuest(id: string, occurrenceId?: string): Promise<Quest> {
    const quest = await this.getQuest(id);
    if (quest.status === 'archived' || quest.status === 'canceled') throw new QuestStateError('Archived or canceled quests cannot be reopened as completed items.');
    const occurrence = occurrenceId ? await this.requireOccurrence(occurrenceId, quest.id) : null;
    if (quest.recurrence && !occurrence) throw new QuestValidationError('A recurring quest occurrence is required.');
    if (occurrence?.status === 'active' || (!occurrence && quest.status === 'active')) return quest;
    const timestamp = this.now();
    const reopenedQuest: Quest = occurrence
      ? { ...quest, updatedAt: timestamp }
      : { ...quest, status: 'active', completedAt: null, updatedAt: timestamp };
    const reopenedOccurrence = occurrence
      ? { ...occurrence, status: 'active' as const, completedAt: null }
      : null;
    const result = await this.repository.reopenQuest(
      reopenedQuest,
      this.createEvent('quest.reopened', id, occurrence?.id ?? null, timestamp, { occurrenceKey: occurrence?.occurrenceKey ?? null }),
      reopenedOccurrence,
    );
    return result.quest;
  }

  async archiveQuest(id: string): Promise<Quest> {
    const quest = await this.getQuest(id);
    if (quest.status === 'archived') return quest;
    const timestamp = this.now();
    const archived = { ...quest, status: 'archived' as const, updatedAt: timestamp };
    return this.repository.archiveQuest(archived, this.createEvent('quest.archived', id, null, timestamp, {}));
  }

  async deleteQuest(id: string): Promise<void> {
    const quest = await this.getQuest(id);
    await this.repository.deleteQuest({ ...quest, deletedAt: this.now() });
  }

  async getDashboard(now = this.now(), timezone = this.timezone()): Promise<QuestDashboard> {
    const [today, overdue, upcoming, completed] = await Promise.all([
      this.listQuests({ view: 'today', now, timezone, sort: 'dueAt' }),
      this.listQuests({ view: 'overdue', now, timezone, sort: 'dueAt' }),
      this.listQuests({ view: 'upcoming', now, timezone, sort: 'dueAt' }),
      this.listQuests({ view: 'completed', now, timezone, sort: 'createdAt', direction: 'desc' }),
    ]);
    return { today, overdue, upcoming: upcoming.slice(0, 5), completedCount: completed.length };
  }

  private assertActionable(quest: Quest): void {
    if (quest.status === 'archived' || quest.status === 'canceled') {
      throw new QuestStateError('Archived or canceled quests cannot be completed.');
    }
  }

  private async requireOccurrence(id: string, questId: string): Promise<QuestOccurrence> {
    const occurrence = await this.repository.getOccurrence(id);
    if (!occurrence || occurrence.questId !== questId) throw new QuestNotFoundError(id);
    return occurrence;
  }

  private createEvent(
    type: QuestEventType,
    aggregateId: string,
    occurrenceId: string | null,
    timestamp: string,
    payload: Readonly<Record<string, unknown>>,
  ): QuestDomainEvent {
    return {
      eventId: this.createId(),
      type,
      schemaVersion: 1,
      aggregateId,
      occurrenceId,
      payload,
      occurredAt: timestamp,
      createdAt: timestamp,
      dedupeKey: `${type}:${aggregateId}:${occurrenceId ?? 'quest'}:${timestamp}`,
    };
  }
}

