import Database from 'better-sqlite3';
import {
  drizzle,
  type BetterSQLite3Database,
} from 'drizzle-orm/better-sqlite3';
import { enrollments } from './schema/enrollments';

const DEFAULT_DB_PATH = 'data/enrollments.db';
const DB_PATH_ENV_VAR = 'ENROLLMENTS_DB_PATH';

const schema = { enrollments } as const;

export type DbClient = BetterSQLite3Database<typeof schema>;
export type SqliteDatabase = Database.Database;

export interface DbContext {
  readonly dbClient: DbClient;
  readonly sqlite: SqliteDatabase;
}

/**
 * Creates a database context for the enrollments SQLite database.
 */
export const createDbContext = (): DbContext => {
  const dbPath = process.env[DB_PATH_ENV_VAR] ?? DEFAULT_DB_PATH;

  const sqlite = new Database(dbPath, {
    fileMustExist: true,
    readonly: true,
  });

  const dbClient = drizzle(sqlite, { schema });

  return { dbClient, sqlite };
};
