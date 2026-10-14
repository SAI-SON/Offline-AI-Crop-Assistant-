import { NativeModules, Platform } from 'react-native';
import { SCHEMA_SQL } from '../database/schema';

const { CropCareDatabase } = NativeModules;

export interface SqlBatchItem {
  sql: string;
  args?: any[];
}

class SqliteService {
  private isReady: boolean = false;

  /**
   * Opens the local SQLite database (cropcare.db).
   */
  async openDatabase(): Promise<boolean> {
    if (this.isReady) return true;

    if (Platform.OS !== 'android' || !CropCareDatabase) {
      console.warn('CropCareDatabase native module only available on Android native builds.');
      return false;
    }

    try {
      const res = await CropCareDatabase.openDatabase();
      this.isReady = !!res?.opened;
      return this.isReady;
    } catch (error) {
      console.error('SqliteService.openDatabase error:', error);
      throw error;
    }
  }

  /**
   * Executes a single SQL statement (INSERT, UPDATE, DELETE, CREATE).
   */
  async executeSql(sql: string, args: any[] = []): Promise<boolean> {
    if (!this.isReady) {
      await this.openDatabase();
    }
    if (!CropCareDatabase) return false;

    try {
      await CropCareDatabase.executeSql(sql, args);
      return true;
    } catch (error) {
      console.error('SqliteService.executeSql error:', error, 'SQL:', sql);
      throw error;
    }
  }

  /**
   * Executes a batch of SQL statements within a single atomic database transaction.
   */
  async executeBatch(statements: SqlBatchItem[]): Promise<boolean> {
    if (!this.isReady) {
      await this.openDatabase();
    }
    if (!CropCareDatabase) return false;

    try {
      await CropCareDatabase.executeBatch(statements);
      return true;
    } catch (error) {
      console.error('SqliteService.executeBatch error:', error);
      throw error;
    }
  }

  /**
   * Queries the database and returns array of row objects.
   */
  async query<T = any>(sql: string, args: any[] = []): Promise<T[]> {
    if (!this.isReady) {
      await this.openDatabase();
    }
    if (!CropCareDatabase) return [];

    try {
      const rows = await CropCareDatabase.query(sql, args);
      return (rows || []) as T[];
    } catch (error) {
      console.error('SqliteService.query error:', error, 'SQL:', sql);
      throw error;
    }
  }

  /**
   * Initializes the database schema (creates tables and indexes).
   */
  async initSchema(): Promise<boolean> {
    await this.openDatabase();

    await this.executeSql(SCHEMA_SQL.CREATE_DISEASES_TABLE);
    await this.executeSql(SCHEMA_SQL.CREATE_ORGANIC_TABLE);
    await this.executeSql(SCHEMA_SQL.CREATE_CHEMICAL_TABLE);
    await this.executeSql(SCHEMA_SQL.CREATE_PREVENTION_TABLE);
    await this.executeSql(SCHEMA_SQL.CREATE_SCAN_HISTORY_TABLE);
    await this.executeSql(SCHEMA_SQL.CREATE_CROP_REQUIREMENTS_TABLE);
    await this.executeSql(SCHEMA_SQL.CREATE_CROP_ANALYSIS_HISTORY_TABLE);

    for (const indexSql of SCHEMA_SQL.CREATE_INDEXES) {
      await this.executeSql(indexSql);
    }

    return true;
  }

  isDatabaseReady(): boolean {
    return this.isReady;
  }
}

export const sqliteService = new SqliteService();
