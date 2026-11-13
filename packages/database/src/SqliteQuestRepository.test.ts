import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { QuestPersistenceError, QuestService, QuestValidationError } from '@hylink/domain';

import type { SqliteConnection } from './connection';
import { migrateDatabase } from './migrations';
import { SqliteQuestRepository } from './SqliteQuestRepository';
import { NodeSqliteConnection } from './testing/NodeSqliteConnection';

function idFactory() {
  let value = 0;
  return () => {
    value += 1;
    return `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
  };
}

describe('persistent quest database', () => {
  let directory: string;
  let path: string;
  let connection: NodeSqliteConnection;
  let repository: SqliteQuestRepository;
  let currentTime: string;
  let service: QuestService;

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'hylink-database-'));
    path = join(directory, 'quests.sqlite');
    connection = new NodeSqliteConnection(path);
    await migrateDatabase(connection, '2026-11-13T10:00:00.000Z');
    repository = new SqliteQuestRepository(connection);
    currentTime = '2026-11-13T10:00:00.000Z';
    service = new QuestService({
      repository,
      now: () => currentTime,
      createId: idFactory(),
      timezone: () => 'America/New_York',
    });
  });

  afterEach(async () => {
    await connection.closeAsync();
    rmSync(directory, { recursive: true, force: true });
  });

  it('initializes versioned migrations idempotently', async () => {
    await migrateDatabase(connection, '2026-11-13T10:01:00.000Z');
    const rows = await connection.getAllAsync<{ readonly id: string }>('SELECT id FROM schema_migrations');
    expect(rows).toEqual([{ id: '0001_quest_foundation' }]);
  });

  it('creates, retrieves, updates, and preserves a quest after reopening', async () => {
    const created = await service.createQuest({
      title: '  Prepare tomorrow  ',
      description: 'Lay out the plan.',
      difficulty: 'hard',
      dueAt: '2026-11-14T22:00:00.000Z',
      priority: 'high',
      notes: 'Keep it small.',
      skillIds: ['focus'],
    });
    currentTime = '2026-11-13T11:00:00.000Z';
    const updated = await service.updateQuest(created.id, { title: 'Prepare the next day', priority: 'urgent' });
    expect(updated.title).toBe('Prepare the next day');
    expect(updated.priority).toBe('urgent');

    await connection.closeAsync();
    connection = new NodeSqliteConnection(path);
    repository = new SqliteQuestRepository(connection);
    const reopened = await repository.getQuest(created.id);
    expect(reopened?.description).toBe('Lay out the plan.');
    expect(reopened?.skillIds).toEqual(['focus']);
    expect(reopened?.priority).toBe('urgent');
  });

  it('completes idempotently and reopens with durable domain events', async () => {
    const quest = await service.createQuest({ title: 'Finish the chapter' });
    currentTime = '2026-11-13T12:00:00.000Z';
    await service.completeQuest(quest.id);
    await service.completeQuest(quest.id);
    let events = await repository.listDomainEvents(quest.id);
    expect(events.filter((event) => event.type === 'quest.completed')).toHaveLength(1);

    currentTime = '2026-11-13T13:00:00.000Z';
    const reopened = await service.reopenQuest(quest.id);
    expect(reopened.status).toBe('active');
    events = await repository.listDomainEvents(quest.id);
    expect(events.map((event) => event.type)).toEqual([
      'quest.created',
      'quest.completed',
      'quest.reopened',
    ]);
  });

  it('archives and soft deletes quests without erasing history', async () => {
    const quest = await service.createQuest({ title: 'Old errand' });
    const archived = await service.archiveQuest(quest.id);
    expect(archived.status).toBe('archived');
    await service.deleteQuest(quest.id);
    await expect(service.getQuest(quest.id)).rejects.toThrow();
    expect((await repository.getQuest(quest.id, true))?.deletedAt).not.toBeNull();
    expect(await repository.listDomainEvents(quest.id)).toHaveLength(2);
  });

  it('filters today, upcoming, and overdue quests correctly', async () => {
    await service.createQuest({ title: 'Overdue', dueAt: '2026-11-12T17:00:00.000Z' });
    await service.createQuest({ title: 'Today', dueAt: '2026-11-13T20:00:00.000Z' });
    await service.createQuest({ title: 'Upcoming', dueAt: '2026-11-15T20:00:00.000Z' });
    const query = { now: currentTime, timezone: 'America/New_York' } as const;
    expect((await service.listQuests({ ...query, view: 'overdue' })).map((item) => item.quest.title)).toEqual(['Overdue']);
    expect((await service.listQuests({ ...query, view: 'today' })).map((item) => item.quest.title)).toEqual(['Today']);
    expect((await service.listQuests({ ...query, view: 'upcoming' })).map((item) => item.quest.title)).toEqual(['Upcoming']);
  });

  it('keeps recurring occurrence completion independent', async () => {
    const quest = await service.createQuest({
      title: 'Daily reflection',
      scheduledAt: '2026-11-13T14:00:00.000Z',
      recurrence: {
        frequency: 'daily',
        interval: 1,
        weekdays: [],
        endsAt: '2026-11-16T23:59:59.000Z',
        timezone: 'America/New_York',
      },
    });
    const items = await service.listQuests({ view: 'all', now: currentTime, timezone: 'America/New_York' });
    const occurrences = items.filter((item) => item.quest.id === quest.id);
    expect(occurrences.length).toBeGreaterThan(1);
    const first = occurrences[0]?.occurrence;
    const second = occurrences[1]?.occurrence;
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    await service.completeQuest(quest.id, first?.id);
    expect((await repository.getOccurrence(first?.id ?? ''))?.status).toBe('completed');
    expect((await repository.getOccurrence(second?.id ?? ''))?.status).toBe('active');
    expect((await repository.getQuest(quest.id))?.status).toBe('active');
  });

  it('rejects empty and invalid quest inputs', async () => {
    await expect(service.createQuest({ title: '   ' })).rejects.toBeInstanceOf(QuestValidationError);
    await expect(service.createQuest({ title: 'Bad date', dueAt: 'not-a-date' })).rejects.toBeInstanceOf(QuestValidationError);
  });

  it('turns low-level database failures into a stable persistence error', async () => {
    const failingConnection: SqliteConnection = {
      execAsync: async () => { throw new Error('disk unavailable'); },
      runAsync: async () => { throw new Error('disk unavailable'); },
      getFirstAsync: async () => { throw new Error('disk unavailable'); },
      getAllAsync: async () => { throw new Error('disk unavailable'); },
      withTransactionAsync: async () => { throw new Error('disk unavailable'); },
    };
    const failingRepository = new SqliteQuestRepository(failingConnection);
    await expect(failingRepository.listQuests()).rejects.toBeInstanceOf(QuestPersistenceError);
  });
});

