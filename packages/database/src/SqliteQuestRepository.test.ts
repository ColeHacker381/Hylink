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

function failCompletionEventWrites(base: SqliteConnection): SqliteConnection {
  const wrap = (connection: SqliteConnection): SqliteConnection => ({
    execAsync: (sql) => connection.execAsync(sql),
    runAsync: (sql, ...params) => {
      if (sql.includes('INSERT INTO domain_events') && params[1] === 'quest.completed') {
        throw new Error('intentional event failure');
      }
      return connection.runAsync(sql, ...params);
    },
    getFirstAsync: <T,>(sql: string, ...params: readonly import('./connection').SqlValue[]) => connection.getFirstAsync<T>(sql, ...params),
    getAllAsync: <T,>(sql: string, ...params: readonly import('./connection').SqlValue[]) => connection.getAllAsync<T>(sql, ...params),
    withTransactionAsync: <T,>(task: (transaction: SqliteConnection) => Promise<T>) => connection.withTransactionAsync((transaction) => task(wrap(transaction))),
  });
  return wrap(base);
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

  it('completes a recurring occurrence during concurrent dashboard refreshes', async () => {
    const quest = await service.createQuest({
      title: 'Physical-device regression',
      scheduledAt: '2026-11-13T14:00:00.000Z',
      recurrence: { frequency: 'daily', interval: 1, weekdays: [], endsAt: null, timezone: 'America/New_York' },
    });
    const occurrence = (await service.listQuests({ view: 'all', now: currentTime, timezone: 'America/New_York' }))[0]?.occurrence;
    expect(occurrence).not.toBeNull();

    await Promise.all([
      service.getDashboard(currentTime, 'America/New_York'),
      service.completeQuest(quest.id, occurrence?.id),
      service.listQuests({ view: 'today', now: currentTime, timezone: 'America/New_York' }),
    ]);

    expect((await repository.getOccurrence(occurrence?.id ?? ''))?.status).toBe('completed');
    const events = await repository.listDomainEvents(quest.id);
    expect(events.filter((event) => event.type === 'quest.completed')).toHaveLength(1);
  });

  it('serializes concurrent completion attempts without duplicate events', async () => {
    const quest = await service.createQuest({ title: 'Complete once' });
    await Promise.all(Array.from({ length: 8 }, () => service.completeQuest(quest.id)));
    const events = await repository.listDomainEvents(quest.id);
    expect(events.filter((event) => event.type === 'quest.completed')).toHaveLength(1);
  });

  it('records one event for each valid completion after a reopen', async () => {
    const quest = await service.createQuest({ title: 'Repeatable transition' });
    await service.completeQuest(quest.id);
    await service.reopenQuest(quest.id);
    await service.completeQuest(quest.id);
    const events = await repository.listDomainEvents(quest.id);
    expect(events.filter((event) => event.type === 'quest.completed')).toHaveLength(2);
  });

  it('rolls back a completion when its event cannot be inserted', async () => {
    const quest = await service.createQuest({ title: 'Atomic completion' });
    const failingRepository = new SqliteQuestRepository(failCompletionEventWrites(connection));
    const failingService = new QuestService({ repository: failingRepository, now: () => currentTime, createId: idFactory() });

    await expect(failingService.completeQuest(quest.id)).rejects.toBeInstanceOf(QuestPersistenceError);
    expect((await repository.getQuest(quest.id))?.status).toBe('active');
    const events = await repository.listDomainEvents(quest.id);
    expect(events.filter((event) => event.type === 'quest.completed')).toHaveLength(0);
  });

  it('preserves completed history while replacing obsolete future recurrence instances', async () => {
    const quest = await service.createQuest({
      title: 'Changing rhythm',
      scheduledAt: '2026-11-13T14:00:00.000Z',
      recurrence: { frequency: 'daily', interval: 1, weekdays: [], endsAt: null, timezone: 'America/New_York' },
    });
    const daily = await service.listQuests({ view: 'all', now: currentTime, timezone: 'America/New_York' });
    const first = daily.find((item) => item.quest.id === quest.id)?.occurrence;
    await service.completeQuest(quest.id, first?.id);
    await service.updateQuest(quest.id, {
      recurrence: { frequency: 'weekly', interval: 1, weekdays: [], endsAt: null, timezone: 'America/New_York' },
    });

    const updated = (await service.listQuests({ view: 'all', now: currentTime, timezone: 'America/New_York' }))
      .filter((item) => item.quest.id === quest.id);
    expect(updated.some((item) => item.occurrence?.id === first?.id && item.occurrence?.status === 'completed')).toBe(true);
    expect(updated.filter((item): item is typeof item & { occurrence: NonNullable<typeof item.occurrence> } => item.occurrence?.status === 'active')
      .every((item) => new Date(item.occurrence.scheduledFor).getUTCDay() === 5)).toBe(true);
  });

  it('rejects empty and invalid quest inputs', async () => {
    await expect(service.createQuest({ title: '   ' })).rejects.toBeInstanceOf(QuestValidationError);
    await expect(service.createQuest({ title: 'Bad date', dueAt: 'not-a-date' })).rejects.toBeInstanceOf(QuestValidationError);
    await expect(service.createQuest({ title: 'Impossible date', dueAt: '2026-02-30T12:00:00.000Z' })).rejects.toBeInstanceOf(QuestValidationError);
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

