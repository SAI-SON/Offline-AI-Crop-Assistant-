import { sqliteService, SqlBatchItem } from '../services/sqliteService';
import { SEED_DATA } from './seed';
import { DiseaseRecord } from '../types';

export async function runDatabaseMigrations(): Promise<boolean> {
  try {
    // 1. Initialize schema (tables + indexes)
    await sqliteService.initSchema();

    // 2. Check if diseases table is already seeded
    const existingDiseases = await sqliteService.query<DiseaseRecord>(
      'SELECT id, label FROM diseases LIMIT 1;'
    );

    if (existingDiseases.length === 0) {
      console.log('Seeding SQLite database with 16 disease management records...');

      // 3. Batch insert diseases
      const diseaseBatch: SqlBatchItem[] = SEED_DATA.diseases.map(d => ({
        sql: `INSERT OR IGNORE INTO diseases (label, crop, disease_name, description, is_healthy)
              VALUES (?, ?, ?, ?, ?);`,
        args: [d.label, d.crop, d.disease_name, d.description, d.is_healthy],
      }));
      await sqliteService.executeBatch(diseaseBatch);

      // Fetch inserted diseases to map IDs
      const allDiseases = await sqliteService.query<DiseaseRecord>('SELECT id, label FROM diseases;');
      const diseaseIdMap = new Map<string, number>();
      for (const d of allDiseases) {
        diseaseIdMap.set(d.label, d.id);
      }

      // 4. Batch insert organic treatments
      const organicBatch: SqlBatchItem[] = [];
      for (const [label, items] of Object.entries(SEED_DATA.organic)) {
        const diseaseId = diseaseIdMap.get(label);
        if (diseaseId) {
          for (const item of items) {
            organicBatch.push({
              sql: `INSERT INTO organic_treatments (disease_id, title, description, category)
                    VALUES (?, ?, ?, ?);`,
              args: [diseaseId, item.title, item.description, item.category],
            });
          }
        }
      }
      if (organicBatch.length > 0) {
        await sqliteService.executeBatch(organicBatch);
      }

      // 5. Batch insert chemical treatments
      const chemicalBatch: SqlBatchItem[] = [];
      for (const [label, items] of Object.entries(SEED_DATA.chemical)) {
        const diseaseId = diseaseIdMap.get(label);
        if (diseaseId) {
          for (const item of items) {
            chemicalBatch.push({
              sql: `INSERT INTO chemical_treatments (disease_id, treatment_type, active_ingredient, description, safety_note)
                    VALUES (?, ?, ?, ?, ?);`,
              args: [diseaseId, item.treatment_type, item.active_ingredient, item.description, item.safety_note],
            });
          }
        }
      }
      if (chemicalBatch.length > 0) {
        await sqliteService.executeBatch(chemicalBatch);
      }

      // 6. Batch insert prevention practices
      const preventionBatch: SqlBatchItem[] = [];
      for (const [label, items] of Object.entries(SEED_DATA.prevention)) {
        const diseaseId = diseaseIdMap.get(label);
        if (diseaseId) {
          for (const prev of items) {
            preventionBatch.push({
              sql: `INSERT INTO prevention (disease_id, prevention) VALUES (?, ?);`,
              args: [diseaseId, prev],
            });
          }
        }
      }
      if (preventionBatch.length > 0) {
        await sqliteService.executeBatch(preventionBatch);
      }

      console.log('Database seeded successfully with all 16 plant disease classes!');
    }

    // 7. Check if crop_requirements table is already seeded
    const existingCrops = await sqliteService.query<{ id: number; crop_name: string }>(
      'SELECT id, crop_name FROM crop_requirements LIMIT 1;'
    );

    if (existingCrops.length === 0 && SEED_DATA.cropRequirements && SEED_DATA.cropRequirements.length > 0) {
      console.log('Seeding SQLite database with authoritative crop requirements (TNAU / ICAR)...');
      const cropBatch: SqlBatchItem[] = SEED_DATA.cropRequirements.map(c => ({
        sql: `INSERT OR IGNORE INTO crop_requirements (
          crop_name, min_ph, max_ph, min_temperature, max_temperature, min_humidity, max_humidity,
          min_rainfall, max_rainfall, min_n, max_n, min_p, max_p, min_k, max_k,
          organic_carbon_min, organic_carbon_max, ec_min, ec_max,
          soil_texture, water_requirement, season, notes, source, source_url, source_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          c.crop_name,
          c.min_ph,
          c.max_ph,
          c.min_temperature,
          c.max_temperature,
          c.min_humidity,
          c.max_humidity,
          c.min_rainfall,
          c.max_rainfall,
          c.min_n,
          c.max_n,
          c.min_p,
          c.max_p,
          c.min_k,
          c.max_k,
          c.organic_carbon_min,
          c.organic_carbon_max,
          c.ec_min,
          c.ec_max,
          c.soil_texture,
          c.water_requirement,
          c.season,
          c.notes,
          c.source,
          c.source_url,
          c.source_note,
        ],
      }));

      await sqliteService.executeBatch(cropBatch);
      console.log(`crop_requirements seeded successfully with ${SEED_DATA.cropRequirements.length} crops!`);
    }

    return true;
  } catch (error) {
    console.error('runDatabaseMigrations error:', error);
    throw error;
  }
}
