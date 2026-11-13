import type { SqliteConnection } from './connection';

interface Migration {
  readonly id: string;
  readonly sql: string;
}

export const migrations: readonly Migration[] = [
  {
    id: '0001_quest_foundation',
    sql: `
      CREATE TABLE quests (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL CHECK (length(trim(title)) > 0),
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('main','side','daily','recurring','miscellaneous')),
        difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','normal','hard','epic')),
        status TEXT NOT NULL CHECK (status IN ('active','completed','canceled','archived')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        due_at TEXT,
        due_timezone TEXT,
        scheduled_at TEXT,
        completed_at TEXT,
        priority TEXT CHECK (priority IS NULL OR priority IN ('low','normal','high','urgent')),
        notes TEXT,
        parent_quest_id TEXT REFERENCES quests(id) ON DELETE SET NULL,
        questline_id TEXT,
        xp_reward_json TEXT,
        rupee_reward_json TEXT,
        recurrence_json TEXT,
        deleted_at TEXT
      );
      CREATE INDEX quests_due_at_idx ON quests(due_at);
      CREATE INDEX quests_scheduled_at_idx ON quests(scheduled_at);
      CREATE INDEX quests_status_idx ON quests(status);
      CREATE INDEX quests_parent_quest_id_idx ON quests(parent_quest_id);

      CREATE TABLE quest_occurrences (
        id TEXT PRIMARY KEY NOT NULL,
        quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
        occurrence_key TEXT NOT NULL UNIQUE,
        scheduled_for TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active','completed')),
        completed_at TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX quest_occurrences_quest_schedule_idx ON quest_occurrences(quest_id, scheduled_for);

      CREATE TABLE domain_events (
        event_id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        schema_version INTEGER NOT NULL,
        aggregate_id TEXT NOT NULL,
        occurrence_id TEXT,
        payload_json TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        dedupe_key TEXT NOT NULL UNIQUE
      );
      CREATE INDEX domain_events_aggregate_idx ON domain_events(aggregate_id, occurred_at);

      CREATE TABLE quest_skill_links (
        quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
        skill_id TEXT NOT NULL,
        PRIMARY KEY (quest_id, skill_id)
      );
      CREATE TABLE quest_location_links (
        quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
        place_id TEXT NOT NULL,
        PRIMARY KEY (quest_id, place_id)
      );
      CREATE TABLE quest_achievement_links (
        quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
        achievement_id TEXT NOT NULL,
        PRIMARY KEY (quest_id, achievement_id)
      );
    `,
  },
];

export async function migrateDatabase(connection: SqliteConnection, now = new Date().toISOString()): Promise<void> {
  await connection.execAsync('PRAGMA foreign_keys = ON;');
  await connection.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
  const applied = await connection.getAllAsync<{ readonly id: string }>('SELECT id FROM schema_migrations');
  const appliedIds = new Set(applied.map((row) => row.id));

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) continue;
    await connection.withTransactionAsync(async (transaction) => {
      await transaction.execAsync(migration.sql);
      await transaction.runAsync(
        'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)',
        migration.id,
        now,
      );
    });
  }
}

