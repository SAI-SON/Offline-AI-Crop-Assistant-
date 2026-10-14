import { sqliteService } from './sqliteService';
import { ScanHistoryRecord } from '../types';

class HistoryService {
  /**
   * Retrieves all scan history entries from SQLite, newest first.
   */
  async getScans(): Promise<ScanHistoryRecord[]> {
    try {
      return await sqliteService.query<ScanHistoryRecord>(
        'SELECT * FROM scan_history ORDER BY id DESC;'
      );
    } catch (error) {
      console.error('HistoryService.getScans error:', error);
      return [];
    }
  }

  /**
   * Saves a new scan to SQLite scan_history table.
   */
  async saveScan(entry: {
    imageUri: string;
    crop: string;
    disease: string;
    label: string;
    confidence: number;
    isHealthy?: boolean;
    inferenceMs?: number;
    createdAt?: string;
  }): Promise<boolean> {
    try {
      const createdAt = entry.createdAt || new Date().toISOString();
      await sqliteService.executeSql(
        `INSERT INTO scan_history (image_uri, crop, disease, label, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [entry.imageUri, entry.crop, entry.disease, entry.label, entry.confidence, createdAt]
      );
      return true;
    } catch (error) {
      console.error('HistoryService.saveScan error:', error);
      throw error;
    }
  }

  /**
   * Deletes an individual scan by SQLite ID.
   */
  async deleteScan(id: number): Promise<boolean> {
    try {
      await sqliteService.executeSql('DELETE FROM scan_history WHERE id = ?;', [id]);
      return true;
    } catch (error) {
      console.error('HistoryService.deleteScan error:', error);
      return false;
    }
  }

  /**
   * Clears all scan history from SQLite.
   */
  async clearAllHistory(): Promise<boolean> {
    try {
      await sqliteService.executeSql('DELETE FROM scan_history;');
      return true;
    } catch (error) {
      console.error('HistoryService.clearAllHistory error:', error);
      return false;
    }
  }
}

export const historyService = new HistoryService();
