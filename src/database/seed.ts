import diseasesData from '../../assets/data/seed/diseases.json';
import organicData from '../../assets/data/seed/organic.json';
import chemicalData from '../../assets/data/seed/chemical.json';
import preventionData from '../../assets/data/seed/prevention.json';
import cropRequirementsData from '../../assets/data/seed/crop_requirements.json';

export interface SeedDisease {
  label: string;
  crop: string;
  disease_name: string;
  description: string;
  is_healthy: number;
}

export interface SeedOrganic {
  title: string;
  description: string;
  category: string;
}

export interface SeedChemical {
  treatment_type: string;
  active_ingredient: string;
  description: string;
  safety_note: string;
}

export interface SeedCropRequirement {
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

export const SEED_DATA = {
  diseases: diseasesData as SeedDisease[],
  organic: organicData as Record<string, SeedOrganic[]>,
  chemical: chemicalData as Record<string, SeedChemical[]>,
  prevention: preventionData as Record<string, string[]>,
  cropRequirements: cropRequirementsData as SeedCropRequirement[],
};
