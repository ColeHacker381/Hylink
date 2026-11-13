import type {
  Quest,
  QuestDomainEvent,
  QuestEventType,
  QuestOccurrence,
  QuestRepository,
  RecurrenceRule,
  RewardPreview,
} from '@hylink/domain';
import { QuestPersistenceError } from '@hylink/domain';

import type { SqliteConnection, SqlValue } from './connection';

interface QuestRow {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly type: Quest['type'];
  readonly difficulty: Quest['difficulty'];
  readonly status: Quest['status'];
  readonly created_at: string;
  readonly updated_at: string;
  readonly due_at: string | null;
  readonly due_timezone: string | null;
  readonly scheduled_at: string | null;
  readonly completed_at: string | null;
  readonly priority: Quest['priority'];
  readonly notes: string | null;
  readonly parent_quest_id: string | null;
  readonly questline_id: string | null;
  readonly xp_reward_json: string | null;
  readonly rupee_reward_json: string | null;
  readonly recurrence_json: string | null;
  readonly deleted_at: string | null;
}

interface OccurrenceRow {
  readonly id: string;
  readonly quest_id: string;
  readonly occurrence_key: string;
  readonly scheduled_for: string;
  readonly status: QuestOccurrence['status'];
  readonly completed_at: string | null;
  readonly created_at: string;
}

interface EventRow {
  readonly event_id: string;
  readonly type: QuestEventType;
  readonly schema_version: 1;
  readonly aggregate_id: string;
  readonly occurrence_id: string | null;
  readonly payload_json: string;
  readonly occurred_at: string;
  readonly created_at: string;
  readonly dedupe_key: string;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  return JSON.parse(value) as T;
}

function mapOccurrence(row: OccurrenceRow): QuestOccurrence {
  return {
    id: row.id,
    questId: row.quest_id,
    occurrenceKey: row.occurrence_key,
    scheduledFor: row.scheduled_for,
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

function mapEvent(row: EventRow): QuestDomainEvent {
  return {
    eventId: row.event_id,
    type: row.type,
    schemaVersion: row.schema_version,
    aggregateId: row.aggregate_id,
    occurrenceId: row.occurrence_id,
    payload: parseJson<Readonly<Record<string, unknown>>>(row.payload_json, {}),
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    dedupeKey: row.dedupe_key,
  };
}

export class SqliteQuestRepository implements QuestRepository {
  constructor(private readonly connection: SqliteConnection) {}

  async createQuest(quest: Quest, event: QuestDomainEvent): Promise<Quest> {
    return this.guard('create quest', async () => {
      await this.connection.withTransactionAsync(async (transaction) => {
        await this.insertQuest(transaction, quest);
        await this.syncLinks(transaction, quest);
        await this.insertEvent(transaction, event);
      });
      return quest;
    });
  }

  async getQuest(id: string, includeDeleted = false): Promise<Quest | null> {
    return this.guard('get quest', async () => {
      const row = await this.connection.getFirstAsync<QuestRow>(
        `SELECT * FROM quests WHERE id = ? ${includeDeleted ? '' : 'AND deleted_at IS NULL'}`,
        id,
      );
      return row ? this.mapQuest(row) : null;
    });
  }

  async listQuests(includeDeleted = false): Promise<readonly Quest[]> {
    return this.guard('list quests', async () => {
      const rows = await this.connection.getAllAsync<QuestRow>(
        `SELECT * FROM quests ${includeDeleted ? '' : 'WHERE deleted_at IS NULL'} ORDER BY created_at DESC`,
      );
      return Promise.all(rows.map((row) => this.mapQuest(row)));
    });
  }

  async updateQuest(quest: Quest, event: QuestDomainEvent): Promise<Quest> {
    return this.guard('update quest', async () => {
      await this.connection.withTransactionAsync(async (transaction) => {
        await this.writeQuest(transaction, quest);
        await this.syncLinks(transaction, quest);
        await this.insertEvent(transaction, event);
      });
      return quest;
    });
  }

  async completeQuest(
    quest: Quest,
    event: QuestDomainEvent,
    occurrence: QuestOccurrence | null,
  ): Promise<{ readonly quest: Quest; readonly occurrence: QuestOccurrence | null; readonly eventCreated: boolean }> {
    return this.commitLifecycle('complete quest', quest, event, occurrence, 'completed');
  }

  async reopenQuest(
    quest: Quest,
    event: QuestDomainEvent,
    occurrence: QuestOccurrence | null,
  ): Promise<{ readonly quest: Quest; readonly occurrence: QuestOccurrence | null; readonly eventCreated: boolean }> {
    return this.commitLifecycle('reopen quest', quest, event, occurrence, 'active');
  }

  async archiveQuest(quest: Quest, event: QuestDomainEvent): Promise<Quest> {
    return this.guard('archive quest', async () => {
      await this.connection.withTransactionAsync(async (transaction) => {
        await this.writeQuest(transaction, quest);
        await this.insertEvent(transaction, event);
      });
      return quest;
    });
  }

  async deleteQuest(quest: Quest): Promise<void> {
    await this.guard('delete quest', async () => {
      await this.connection.runAsync(
        'UPDATE quests SET deleted_at = ?, updated_at = ? WHERE id = ?',
        quest.deletedAt,
        quest.deletedAt,
        quest.id,
      );
    });
  }

  async saveOccurrences(occurrences: readonly QuestOccurrence[]): Promise<void> {
    await this.guard('save quest occurrences', async () => {
      if (occurrences.length === 0) return;
      await this.connection.withTransactionAsync(async (transaction) => {
        for (const occurrence of occurrences) {
          await transaction.runAsync(
            `INSERT INTO quest_occurrences
              (id, quest_id, occurrence_key, scheduled_for, status, completed_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(occurrence_key) DO NOTHING`,
            occurrence.id,
            occurrence.questId,
            occurrence.occurrenceKey,
            occurrence.scheduledFor,
            occurrence.status,
            occurrence.completedAt,
            occurrence.createdAt,
          );
        }
      });
    });
  }

  async getOccurrence(id: string): Promise<QuestOccurrence | null> {
    return this.guard('get quest occurrence', async () => {
      const row = await this.connection.getFirstAsync<OccurrenceRow>(
        'SELECT * FROM quest_occurrences WHERE id = ?',
        id,
      );
      return row ? mapOccurrence(row) : null;
    });
  }

  async listOccurrences(questId: string, from: string, to: string): Promise<readonly QuestOccurrence[]> {
    return this.guard('list quest occurrences', async () => {
      const rows = await this.connection.getAllAsync<OccurrenceRow>(
        `SELECT * FROM quest_occurrences
         WHERE quest_id = ? AND scheduled_for >= ? AND scheduled_for <= ?
         ORDER BY scheduled_for ASC`,
        questId,
        from,
        to,
      );
      return rows.map(mapOccurrence);
    });
  }

  async listDomainEvents(aggregateId: string): Promise<readonly QuestDomainEvent[]> {
    return this.guard('list quest events', async () => {
      const rows = await this.connection.getAllAsync<EventRow>(
        'SELECT * FROM domain_events WHERE aggregate_id = ? ORDER BY occurred_at ASC',
        aggregateId,
      );
      return rows.map(mapEvent);
    });
  }

  private async commitLifecycle(
    operation: string,
    quest: Quest,
    event: QuestDomainEvent,
    occurrence: QuestOccurrence | null,
    targetStatus: 'active' | 'completed',
  ): Promise<{ readonly quest: Quest; readonly occurrence: QuestOccurrence | null; readonly eventCreated: boolean }> {
    return this.guard(operation, async () => {
      let eventCreated = false;
      await this.connection.withTransactionAsync(async (transaction) => {
        if (occurrence) {
          const update = await transaction.runAsync(
            'UPDATE quest_occurrences SET status = ?, completed_at = ? WHERE id = ? AND status <> ?',
            occurrence.status,
            occurrence.completedAt,
            occurrence.id,
            targetStatus,
          );
          if (update.changes === 0) return;
          await this.writeQuest(transaction, quest);
        } else {
          const update = await transaction.runAsync(
            `UPDATE quests SET status = ?, completed_at = ?, updated_at = ?
             WHERE id = ? AND status <> ?`,
            quest.status,
            quest.completedAt,
            quest.updatedAt,
            quest.id,
            targetStatus,
          );
          if (update.changes === 0) return;
        }
        eventCreated = (await this.insertEvent(transaction, event)) > 0;
      });
      return { quest, occurrence, eventCreated };
    });
  }

  private async insertQuest(connection: SqliteConnection, quest: Quest): Promise<void> {
    await connection.runAsync(
      `INSERT INTO quests (
        id, title, description, type, difficulty, status, created_at, updated_at,
        due_at, due_timezone, scheduled_at, completed_at, priority, notes,
        parent_quest_id, questline_id, xp_reward_json, rupee_reward_json,
        recurrence_json, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ...this.questValues(quest),
    );
  }

  private async writeQuest(connection: SqliteConnection, quest: Quest): Promise<void> {
    await connection.runAsync(
      `UPDATE quests SET
        title = ?, description = ?, type = ?, difficulty = ?, status = ?,
        created_at = ?, updated_at = ?, due_at = ?, due_timezone = ?, scheduled_at = ?,
        completed_at = ?, priority = ?, notes = ?, parent_quest_id = ?, questline_id = ?,
        xp_reward_json = ?, rupee_reward_json = ?, recurrence_json = ?, deleted_at = ?
       WHERE id = ?`,
      quest.title,
      quest.description,
      quest.type,
      quest.difficulty,
      quest.status,
      quest.createdAt,
      quest.updatedAt,
      quest.dueAt,
      quest.dueTimezone,
      quest.scheduledAt,
      quest.completedAt,
      quest.priority,
      quest.notes,
      quest.parentQuestId,
      quest.questlineId,
      quest.xpReward ? JSON.stringify(quest.xpReward) : null,
      quest.rupeeReward ? JSON.stringify(quest.rupeeReward) : null,
      quest.recurrence ? JSON.stringify(quest.recurrence) : null,
      quest.deletedAt,
      quest.id,
    );
  }

  private questValues(quest: Quest): readonly SqlValue[] {
    return [
      quest.id,
      quest.title,
      quest.description,
      quest.type,
      quest.difficulty,
      quest.status,
      quest.createdAt,
      quest.updatedAt,
      quest.dueAt,
      quest.dueTimezone,
      quest.scheduledAt,
      quest.completedAt,
      quest.priority,
      quest.notes,
      quest.parentQuestId,
      quest.questlineId,
      quest.xpReward ? JSON.stringify(quest.xpReward) : null,
      quest.rupeeReward ? JSON.stringify(quest.rupeeReward) : null,
      quest.recurrence ? JSON.stringify(quest.recurrence) : null,
      quest.deletedAt,
    ];
  }

  private async insertEvent(connection: SqliteConnection, event: QuestDomainEvent): Promise<number> {
    const result = await connection.runAsync(
      `INSERT INTO domain_events (
        event_id, type, schema_version, aggregate_id, occurrence_id,
        payload_json, occurred_at, created_at, dedupe_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(dedupe_key) DO NOTHING`,
      event.eventId,
      event.type,
      event.schemaVersion,
      event.aggregateId,
      event.occurrenceId,
      JSON.stringify(event.payload),
      event.occurredAt,
      event.createdAt,
      event.dedupeKey,
    );
    return result.changes;
  }

  private async syncLinks(connection: SqliteConnection, quest: Quest): Promise<void> {
    await connection.runAsync('DELETE FROM quest_skill_links WHERE quest_id = ?', quest.id);
    await connection.runAsync('DELETE FROM quest_achievement_links WHERE quest_id = ?', quest.id);
    for (const skillId of quest.skillIds) {
      await connection.runAsync(
        'INSERT INTO quest_skill_links (quest_id, skill_id) VALUES (?, ?)',
        quest.id,
        skillId,
      );
    }
    for (const achievementId of quest.achievementIds) {
      await connection.runAsync(
        'INSERT INTO quest_achievement_links (quest_id, achievement_id) VALUES (?, ?)',
        quest.id,
        achievementId,
      );
    }
  }

  private async mapQuest(row: QuestRow): Promise<Quest> {
    const [skillRows, achievementRows] = await Promise.all([
      this.connection.getAllAsync<{ readonly skill_id: string }>(
        'SELECT skill_id FROM quest_skill_links WHERE quest_id = ? ORDER BY skill_id',
        row.id,
      ),
      this.connection.getAllAsync<{ readonly achievement_id: string }>(
        'SELECT achievement_id FROM quest_achievement_links WHERE quest_id = ? ORDER BY achievement_id',
        row.id,
      ),
    ]);
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      difficulty: row.difficulty,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      dueAt: row.due_at,
      dueTimezone: row.due_timezone,
      scheduledAt: row.scheduled_at,
      completedAt: row.completed_at,
      priority: row.priority,
      notes: row.notes,
      parentQuestId: row.parent_quest_id,
      questlineId: row.questline_id,
      skillIds: skillRows.map((item) => item.skill_id),
      achievementIds: achievementRows.map((item) => item.achievement_id),
      xpReward: parseJson<RewardPreview | null>(row.xp_reward_json, null),
      rupeeReward: parseJson<RewardPreview | null>(row.rupee_reward_json, null),
      recurrence: parseJson<RecurrenceRule | null>(row.recurrence_json, null),
      deletedAt: row.deleted_at,
    };
  }

  private async guard<T>(operation: string, task: () => Promise<T>): Promise<T> {
    try {
      return await task();
    } catch (error) {
      if (error instanceof QuestPersistenceError) throw error;
      throw new QuestPersistenceError(`Unable to ${operation}.`, error);
    }
  }
}

