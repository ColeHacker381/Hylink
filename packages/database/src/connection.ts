export type SqlValue = string | number | null | Uint8Array;

export interface SqliteRunResult {
  readonly changes: number;
  readonly lastInsertRowId: number;
}

export interface SqliteConnection {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: readonly SqlValue[]): Promise<SqliteRunResult>;
  getFirstAsync<T>(sql: string, ...params: readonly SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: readonly SqlValue[]): Promise<readonly T[]>;
  withTransactionAsync<T>(task: (transaction: SqliteConnection) => Promise<T>): Promise<T>;
  closeAsync?(): Promise<void>;
}

