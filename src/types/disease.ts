export interface DiseaseRecord {
  id: number;
  label: string;
  crop: string;
  disease_name: string;
  description: string;
  is_healthy: number; // 0 or 1
}

export type OrganicCategory =
  | 'cultural'
  | 'sanitation'
  | 'biological'
  | 'soil'
  | 'irrigation'
  | 'monitoring';

export interface OrganicTreatment {
  id: number;
  disease_id: number;
  title: string;
  description: string;
  category: OrganicCategory | string;
}

export interface ChemicalTreatment {
  id: number;
  disease_id: number;
  treatment_type: string; // Fungicide, Bactericide, Acaricide, Vector Control, etc.
  active_ingredient: string;
  description: string;
  safety_note: string;
}

export interface PreventionRecord {
  id: number;
  disease_id: number;
  prevention: string;
}

export interface DiseaseDetail {
  label: string;
  crop: string;
  disease: string;
  status: 'healthy' | 'diseased';
  description: string;
  symptoms: string[];
  prevention: string[];
  disclaimer: string;
}

export interface FullDiseaseData {
  disease: DiseaseRecord;
  organicTreatments: OrganicTreatment[];
  chemicalTreatments: ChemicalTreatment[];
  prevention: PreventionRecord[];
}
