import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import type { SqliteConnection, SqliteRunResult, SqlValue } from './connection';

function toExpoValue(value: SqlValue): SQLiteBindValue {
  return value;
}

export class ExpoSqliteConnection implements SqliteConnection {
  constructor(private readonly database: SQLiteDatabase) {}

  async execAsync(sql: string): Promise<void> {
    await this.database.execAsync(sql);
  }

  async runAsync(sql: string, ...params: readonly SqlValue[]): Promise<SqliteRunResult> {
    const result = await this.database.runAsync(sql, ...params.map(toExpoValue));
    return { changes: result.changes, lastInsertRowId: result.lastInsertRowId };
  }

  async getFirstAsync<T>(sql: string, ...params: readonly SqlValue[]): Promise<T | null> {
    return this.database.getFirstAsync<T>(sql, ...params.map(toExpoValue));
  }

  async getAllAsync<T>(sql: string, ...params: readonly SqlValue[]): Promise<readonly T[]> {
    return this.database.getAllAsync<T>(sql, ...params.map(toExpoValue));
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await this.database.withTransactionAsync(task);
  }

  async closeAsync(): Promise<void> {
    await this.database.closeAsync();
  }
}

