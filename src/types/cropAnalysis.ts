export type SoilTexture =
  | 'Sandy'
  | 'Loamy'
  | 'Clay'
  | 'Sandy Loam'
  | 'Clay Loam'
  | 'Silty'
  | 'Unknown';

export type WaterAvailability = 'Low' | 'Medium' | 'High';

export type SeasonType = 'Kharif' | 'Rabi' | 'Summer' | 'Year-round';

export interface CropRequirement {
  id: number;
  crop_name: string;
  min_ph: number | null;
  max_ph: number | null;
  min_temperature: number | null;
  max_temperature: number | null;
  min_humidity: number | null;
  max_humidity: number | null;
  min_rainfall: number | null;
  max_rainfall: number | null;
  min_n: number | null;
  max_n: number | null;
  min_p: number | null;
  max_p: number | null;
  min_k: number | null;
  max_k: number | null;
  organic_carbon_min: number | null;
  organic_carbon_max: number | null;
  ec_min: number | null;
  ec_max: number | null;
  soil_texture: string | null;
  water_requirement: string | null;
  season: string | null;
  notes: string | null;
  source: string | null;
  source_url: string | null;
  source_note: string | null;
}

export interface UserCropInput {
  // Soil Properties
  n?: number | null;
  p?: number | null;
  k?: number | null;
  ph?: number | null;
  organicCarbon?: number | null;
  ec?: number | null;
  soilTexture?: SoilTexture;

  // Environmental Factors
  temperature?: number | null;
  humidity?: number | null;
  rainfall?: number | null;
  waterAvailability?: WaterAvailability;
  season?: SeasonType;
}

export type FactorStatus = 'Suitable' | 'Moderately Suitable' | 'Not Suitable' | 'Unavailable';

export interface FactorResult {
  factor: string;
  category: 'soil' | 'environment';
  userValue?: number | string | null;
  requirement?: string;
  status: FactorStatus;
  points: number;
  maxPoints: number;
  explanation: string;
}

export type CropSuitabilityStatus = 'Suitable' | 'Moderately Suitable' | 'Not Suitable';

export interface CropAnalysisResult {
  crop: string;
  overallScore: number;
  status: CropSuitabilityStatus;
  factors: FactorResult[];
  strengths: string[];
  limitations: string[];
  missingFactors: string[];
  guidance: string[];
  sourceInfo?: {
    source: string | null;
    sourceUrl: string | null;
    sourceNote: string | null;
  };
}

export interface CropRecommendationItem {
  crop: CropRequirement;
  score: number;
  status: CropSuitabilityStatus;
  strengthsCount: number;
  limitationsCount: number;
  analysis: CropAnalysisResult;
}

export interface CropAnalysisHistoryRecord {
  id: number;
  crop_name: string;
  score: number;
  status: CropSuitabilityStatus;
  input_data: string; // JSON string
  result_data: string; // JSON string
  created_at: string;
}
