import { sqliteService } from './sqliteService';
import {
  DiseaseRecord,
  OrganicTreatment,
  ChemicalTreatment,
  PreventionRecord,
  FullDiseaseData,
} from '../types';

class DiseaseService {
  /**
   * Fetches full disease details (disease, organic, chemical, prevention) from SQLite by model label.
   */
  async getDiseaseByLabel(label: string): Promise<FullDiseaseData | null> {
    try {
      const diseases = await sqliteService.query<DiseaseRecord>(
        'SELECT * FROM diseases WHERE label = ? LIMIT 1;',
        [label]
      );

      if (diseases.length === 0) {
        return null;
      }

      const disease = diseases[0];
      const diseaseId = disease.id;

      // Relational queries
      const [organicTreatments, chemicalTreatments, prevention] = await Promise.all([
        sqliteService.query<OrganicTreatment>(
          'SELECT * FROM organic_treatments WHERE disease_id = ? ORDER BY id ASC;',
          [diseaseId]
        ),
        sqliteService.query<ChemicalTreatment>(
          'SELECT * FROM chemical_treatments WHERE disease_id = ? ORDER BY id ASC;',
          [diseaseId]
        ),
        sqliteService.query<PreventionRecord>(
          'SELECT * FROM prevention WHERE disease_id = ? ORDER BY id ASC;',
          [diseaseId]
        ),
      ]);

      return {
        disease,
        organicTreatments,
        chemicalTreatments,
        prevention,
      };
    } catch (error) {
      console.error('DiseaseService.getDiseaseByLabel error:', error);
      throw error;
    }
  }

  /**
   * Searches local SQLite disease database by keyword without any network requests.
   */
  async searchDiseases(queryText: string): Promise<DiseaseRecord[]> {
    try {
      const clean = `%${(queryText || '').trim()}%`;
      return await sqliteService.query<DiseaseRecord>(
        `SELECT * FROM diseases
         WHERE disease_name LIKE ? OR crop LIKE ? OR description LIKE ?
         ORDER BY crop ASC, disease_name ASC;`,
        [clean, clean, clean]
      );
    } catch (error) {
      console.error('DiseaseService.searchDiseases error:', error);
      return [];
    }
  }

  /**
   * Returns all 16 disease records from SQLite.
   */
  async getAllDiseases(): Promise<DiseaseRecord[]> {
    try {
      return await sqliteService.query<DiseaseRecord>(
        'SELECT * FROM diseases ORDER BY crop ASC, is_healthy ASC, disease_name ASC;'
      );
    } catch (error) {
      console.error('DiseaseService.getAllDiseases error:', error);
      return [];
    }
  }

  /**
   * Returns total number of disease records in SQLite.
   */
  async getDiseaseCount(): Promise<number> {
    try {
      const res = await sqliteService.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM diseases;'
      );
      return res[0]?.count || 0;
    } catch {
      return 0;
    }
  }
}

export const diseaseService = new DiseaseService();
