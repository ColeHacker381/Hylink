import type { QuestDomainEvent } from './events';
import type { Quest, QuestOccurrence } from './types';

export interface QuestRepository {
  createQuest(quest: Quest, event: QuestDomainEvent): Promise<Quest>;
  getQuest(id: string, includeDeleted?: boolean): Promise<Quest | null>;
  listQuests(includeDeleted?: boolean): Promise<readonly Quest[]>;
  updateQuest(quest: Quest, event: QuestDomainEvent): Promise<Quest>;
  completeQuest(
    quest: Quest,
    event: QuestDomainEvent,
    occurrence: QuestOccurrence | null,
  ): Promise<{ readonly quest: Quest; readonly occurrence: QuestOccurrence | null; readonly eventCreated: boolean }>;
  reopenQuest(
    quest: Quest,
    event: QuestDomainEvent,
    occurrence: QuestOccurrence | null,
  ): Promise<{ readonly quest: Quest; readonly occurrence: QuestOccurrence | null; readonly eventCreated: boolean }>;
  archiveQuest(quest: Quest, event: QuestDomainEvent): Promise<Quest>;
  deleteQuest(quest: Quest): Promise<void>;
  saveOccurrences(occurrences: readonly QuestOccurrence[]): Promise<void>;
  getOccurrence(id: string): Promise<QuestOccurrence | null>;
  listOccurrences(questId: string, from: string, to: string): Promise<readonly QuestOccurrence[]>;
  listDomainEvents(aggregateId: string): Promise<readonly QuestDomainEvent[]>;
}

