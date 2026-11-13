import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import type { SqliteConnection, SqliteRunResult, SqlValue } from './connection';

function toExpoValue(value: SqlValue): SQLiteBindValue {
  return value;
}

export class ExpoSqliteConnection implements SqliteConnection {
  private transactionTail: Promise<void> = Promise.resolve();

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

  async withTransactionAsync<T>(task: (transaction: SqliteConnection) => Promise<T>): Promise<T> {
    const previous = this.transactionTail;
    let release: () => void = () => {};
    this.transactionTail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      let result: T | undefined;
      if (typeof document !== 'undefined') {
        await this.database.withTransactionAsync(async () => {
          result = await task(this);
        });
      } else {
        await this.database.withExclusiveTransactionAsync(async (transaction) => {
          result = await task(new ExpoSqliteConnection(transaction));
        });
      }
      return result as T;
    } finally {
      release();
    }
  }

  async closeAsync(): Promise<void> {
    await this.database.closeAsync();
  }
}

