import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { SqliteConnection, SqliteRunResult, SqlValue } from '../connection';

function toNodeValue(value: SqlValue): SQLInputValue {
  return value;
}

export class NodeSqliteConnection implements SqliteConnection {
  private readonly database: DatabaseSync;

  constructor(path: string) {
    this.database = new DatabaseSync(path);
  }

  async execAsync(sql: string): Promise<void> {
    this.database.exec(sql);
  }

  async runAsync(sql: string, ...params: readonly SqlValue[]): Promise<SqliteRunResult> {
    const result = this.database.prepare(sql).run(...params.map(toNodeValue));
    return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
  }

  async getFirstAsync<T>(sql: string, ...params: readonly SqlValue[]): Promise<T | null> {
    return (this.database.prepare(sql).get(...params.map(toNodeValue)) as T | undefined) ?? null;
  }

  async getAllAsync<T>(sql: string, ...params: readonly SqlValue[]): Promise<readonly T[]> {
    return this.database.prepare(sql).all(...params.map(toNodeValue)) as T[];
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      await task();
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  async closeAsync(): Promise<void> {
    this.database.close();
  }
}

