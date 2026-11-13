import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { SqliteConnection, SqliteRunResult, SqlValue } from '../connection';

function toNodeValue(value: SqlValue): SQLInputValue {
  return value;
}

export class NodeSqliteConnection implements SqliteConnection {
  private readonly database: DatabaseSync;
  private transactionTail: Promise<void> = Promise.resolve();

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

  async withTransactionAsync<T>(task: (transaction: SqliteConnection) => Promise<T>): Promise<T> {
    const previous = this.transactionTail;
    let release: () => void = () => {};
    this.transactionTail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      this.database.exec('BEGIN IMMEDIATE');
      try {
        const result = await task(this);
        this.database.exec('COMMIT');
        return result;
      } catch (error) {
        this.database.exec('ROLLBACK');
        throw error;
      }
    } finally {
      release();
    }
  }

  async closeAsync(): Promise<void> {
    this.database.close();
  }
}

