export type QuestEventType =
  | 'quest.created'
  | 'quest.updated'
  | 'quest.completed'
  | 'quest.reopened'
  | 'quest.archived';

export interface QuestDomainEvent {
  readonly eventId: string;
  readonly type: QuestEventType;
  readonly schemaVersion: 1;
  readonly aggregateId: string;
  readonly occurrenceId: string | null;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly occurredAt: string;
  readonly createdAt: string;
  readonly dedupeKey: string;
}

