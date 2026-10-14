export const DB_NAME = 'cropcare.db';

export const SCHEMA_SQL = {
  CREATE_DISEASES_TABLE: `
    CREATE TABLE IF NOT EXISTS diseases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT UNIQUE NOT NULL,
      crop TEXT NOT NULL,
      disease_name TEXT NOT NULL,
      description TEXT,
      is_healthy INTEGER NOT NULL DEFAULT 0
    );
  `,

  CREATE_ORGANIC_TABLE: `
    CREATE TABLE IF NOT EXISTS organic_treatments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disease_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE
    );
  `,

  CREATE_CHEMICAL_TABLE: `
    CREATE TABLE IF NOT EXISTS chemical_treatments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disease_id INTEGER NOT NULL,
      treatment_type TEXT NOT NULL,
      active_ingredient TEXT,
      description TEXT NOT NULL,
      safety_note TEXT,
      FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE
    );
  `,

  CREATE_PREVENTION_TABLE: `
    CREATE TABLE IF NOT EXISTS prevention (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disease_id INTEGER NOT NULL,
      prevention TEXT NOT NULL,
      FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE
    );
  `,

  CREATE_SCAN_HISTORY_TABLE: `
    CREATE TABLE IF NOT EXISTS scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_uri TEXT,
      crop TEXT NOT NULL,
      disease TEXT NOT NULL,
      label TEXT NOT NULL,
      confidence REAL NOT NULL,
      created_at TEXT NOT NULL
    );
  `,

  CREATE_CROP_REQUIREMENTS_TABLE: `
    CREATE TABLE IF NOT EXISTS crop_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_name TEXT UNIQUE NOT NULL,
      min_ph REAL,
      max_ph REAL,
      min_temperature REAL,
      max_temperature REAL,
      min_humidity REAL,
      max_humidity REAL,
      min_rainfall REAL,
      max_rainfall REAL,
      min_n REAL,
      max_n REAL,
      min_p REAL,
      max_p REAL,
      min_k REAL,
      max_k REAL,
      organic_carbon_min REAL,
      organic_carbon_max REAL,
      ec_min REAL,
      ec_max REAL,
      soil_texture TEXT,
      water_requirement TEXT,
      season TEXT,
      notes TEXT,
      source TEXT,
      source_url TEXT,
      source_note TEXT
    );
  `,

  CREATE_CROP_ANALYSIS_HISTORY_TABLE: `
    CREATE TABLE IF NOT EXISTS crop_analysis_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_name TEXT NOT NULL,
      score REAL NOT NULL,
      status TEXT NOT NULL,
      input_data TEXT NOT NULL,
      result_data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `,

  CREATE_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_diseases_label ON diseases(label);',
    'CREATE INDEX IF NOT EXISTS idx_organic_disease_id ON organic_treatments(disease_id);',
    'CREATE INDEX IF NOT EXISTS idx_chemical_disease_id ON chemical_treatments(disease_id);',
    'CREATE INDEX IF NOT EXISTS idx_prevention_disease_id ON prevention(disease_id);',
    'CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history(created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_crop_requirements_name ON crop_requirements(crop_name);',
    'CREATE INDEX IF NOT EXISTS idx_crop_analysis_history_created_at ON crop_analysis_history(created_at DESC);',
  ],
};
