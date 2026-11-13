import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync } from 'expo-sqlite';

import { ExpoSqliteConnection } from './ExpoSqliteConnection';
import { migrateDatabase } from './migrations';
import { databaseSchema } from './schema';
import { SqliteQuestRepository } from './SqliteQuestRepository';

export async function openHylinkDatabase(name = 'hylink.db') {
  const sqlite = await openDatabaseAsync(name);
  const connection = new ExpoSqliteConnection(sqlite);
  await migrateDatabase(connection);
  return {
    connection,
    orm: drizzle(sqlite, { schema: databaseSchema }),
    questRepository: new SqliteQuestRepository(connection),
    close: () => connection.closeAsync(),
  };
}

