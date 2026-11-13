import { statSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { generateQuestOccurrences, QuestService, type Quest } from '@hylink/domain';

import { migrateDatabase } from '../src/migrations';
import { SqliteQuestRepository } from '../src/SqliteQuestRepository';
import { NodeSqliteConnection } from '../src/testing/NodeSqliteConnection';

function sequentialIds() {
  let next = 0;
  return () => `10000000-0000-4000-8000-${String(next += 1).padStart(12, '0')}`;
}

function elapsed<T>(task: () => Promise<T>): Promise<{ readonly result: T; readonly milliseconds: number }> {
  const start = performance.now();
  return task().then((result) => ({ result, milliseconds: performance.now() - start }));
}

describe('isolated quest persistence benchmark', () => {
  let directory: string;
  let path: string;
  let connection: NodeSqliteConnection;
  let repository: SqliteQuestRepository;
  let service: QuestService;
  const metrics: Record<string, number> = {};

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'hylink-benchmark-'));
    path = join(directory, 'benchmark.sqlite');
    connection = new NodeSqliteConnection(path);
    await migrateDatabase(connection, '2026-11-13T12:00:00.000Z');
    repository = new SqliteQuestRepository(connection);
    service = new QuestService({
      repository,
      now: () => '2026-11-13T12:00:00.000Z',
      createId: sequentialIds(),
      timezone: () => 'America/Indiana/Indianapolis',
    });
  });

  afterAll(async () => {
    metrics.databaseBytes = statSync(path).size;
    metrics.heapUsedBytes = process.memoryUsage().heapUsed;
    console.info(`Hylink benchmark metrics (Node.js, not iPhone): ${JSON.stringify(metrics, null, 2)}`);
    await connection.closeAsync();
    await rm(directory, { recursive: true, force: true });
  });

  it('creates, loads, updates, completes, reopens, filters, and sorts large quest sets', async () => {
    metrics.create100Ms = (await elapsed(async () => {
      for (let index = 0; index < 100; index += 1) await service.createQuest({ title: `Quest ${index}` });
    })).milliseconds;
    for (let index = 100; index < 1_000; index += 1) await service.createQuest({ title: `Quest ${index}`, priority: index % 2 ? 'high' : 'low' });

    const loaded = await elapsed(() => repository.listQuests());
    metrics.load1000Ms = loaded.milliseconds;
    expect(loaded.result).toHaveLength(1_000);
    const firstHundred = loaded.result.slice(0, 100);

    metrics.update100Ms = (await elapsed(async () => {
      for (const quest of firstHundred) await service.updateQuest(quest.id, { notes: 'Benchmarked' });
    })).milliseconds;
    metrics.complete100Ms = (await elapsed(async () => {
      for (const quest of firstHundred) await service.completeQuest(quest.id);
    })).milliseconds;
    metrics.reopen100Ms = (await elapsed(async () => {
      for (const quest of firstHundred) await service.reopenQuest(quest.id);
    })).milliseconds;
    metrics.filterSort1000Ms = (await elapsed(() => service.listQuests({ view: 'all', sort: 'priority', direction: 'desc' }))).milliseconds;
  });

  it('generates recurring windows without duplicates, including multi-year seeds', async () => {
    const recurring: Quest[] = [];
    for (let index = 0; index < 100; index += 1) {
      recurring.push(await service.createQuest({
        title: `Recurring ${index}`,
        scheduledAt: '2026-11-13T14:00:00.000Z',
        recurrence: { frequency: 'daily', interval: 1, weekdays: [], endsAt: null, timezone: 'America/Indiana/Indianapolis' },
      }));
    }
    metrics.generate100Recurring60DayWindowMs = (await elapsed(() => service.listQuests({ view: 'all' }))).milliseconds;
    const firstCount = await connection.getFirstAsync<{ readonly count: number }>('SELECT COUNT(*) AS count FROM quest_occurrences');
    metrics.reloadExistingWindowMs = (await elapsed(() => service.listQuests({ view: 'all' }))).milliseconds;
    const secondCount = await connection.getFirstAsync<{ readonly count: number }>('SELECT COUNT(*) AS count FROM quest_occurrences');
    expect(secondCount?.count).toBe(firstCount?.count);

    const oldQuest = { ...recurring[0]!, createdAt: '2020-01-01T14:00:00.000Z', scheduledAt: '2020-01-01T14:00:00.000Z' };
    metrics.generateMultiYearWindowMs = (await elapsed(async () => generateQuestOccurrences(oldQuest, {
      from: '2026-11-01T00:00:00.000Z',
      to: '2026-12-31T23:59:59.000Z',
      now: '2026-11-01T00:00:00.000Z',
      createId: sequentialIds(),
    }))).milliseconds;
  });

  it('serializes simultaneous completion and persists after reopening the database', async () => {
    const quest = await service.createQuest({ title: 'Concurrent benchmark' });
    metrics.concurrentCompletionMs = (await elapsed(() => Promise.all(
      Array.from({ length: 20 }, () => service.completeQuest(quest.id)),
    ))).milliseconds;
    expect((await repository.listDomainEvents(quest.id)).filter((event) => event.type === 'quest.completed')).toHaveLength(1);

    await connection.closeAsync();
    connection = new NodeSqliteConnection(path);
    repository = new SqliteQuestRepository(connection);
    const reopened = await elapsed(() => repository.getQuest(quest.id));
    metrics.reopenDatabaseReadMs = reopened.milliseconds;
    expect(reopened.result?.status).toBe('completed');
  });
});
