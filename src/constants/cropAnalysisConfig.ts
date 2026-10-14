import { SoilTexture, WaterAvailability, SeasonType } from '../types/cropAnalysis';

/**
 * Application-level heuristic factor weights.
 * IMPORTANT: These are NOT official agricultural weights, but an application-level scoring configuration.
 */
export const CROP_ANALYSIS_WEIGHTS = {
  ph: 15,
  n: 10,
  p: 10,
  k: 10,
  temperature: 15,
  humidity: 10,
  rainfall: 15,
  organicCarbon: 5,
  ec: 5,
  soilTexture: 3,
  waterAvailability: 2,
};

export const SUITABILITY_THRESHOLDS = {
  SUITABLE_MIN: 80,
  MODERATE_MIN: 60,
};

/**
 * Relative tolerance for "Near boundary" evaluation of numeric ranges (15% of range span).
 */
export const BOUNDARY_TOLERANCE_RATIO = 0.15;

/**
 * Soil texture compatibility mapping rules.
 * Compares user texture against keywords in the crop requirement description.
 */
export const SOIL_TEXTURE_COMPATIBILITY: Record<
  SoilTexture,
  { compatibleKeywords: string[]; moderateKeywords: string[] }
> = {
  Sandy: {
    compatibleKeywords: ['sandy', 'light sandy loam', 'red sandy loam', 'friable'],
    moderateKeywords: ['loamy', 'well-drained'],
  },
  'Sandy Loam': {
    compatibleKeywords: ['sandy loam', 'light sandy loam', 'red sandy loam', 'loam'],
    moderateKeywords: ['clay loam', 'alluvial'],
  },
  Loamy: {
    compatibleKeywords: ['loam', 'loamy', 'alluvial', 'fertile loam'],
    moderateKeywords: ['sandy loam', 'clay loam'],
  },
  'Clay Loam': {
    compatibleKeywords: ['clay loam', 'loamy', 'black cotton', 'vertisol'],
    moderateKeywords: ['clayey', 'silty clay', 'sandy loam'],
  },
  Clay: {
    compatibleKeywords: ['clay', 'clayey', 'heavy clay', 'black cotton', 'vertisol', 'water retention'],
    moderateKeywords: ['clay loam', 'silty clay'],
  },
  Silty: {
    compatibleKeywords: ['silty', 'silt loam', 'deltaic', 'alluvial'],
    moderateKeywords: ['loam', 'clay loam'],
  },
  Unknown: {
    compatibleKeywords: [],
    moderateKeywords: [],
  },
};

/**
 * Water requirement compatibility matrix.
 */
export const WATER_AVAILABILITY_MATRIX: Record<
  WaterAvailability, // User's available water
  Record<string, { scoreRatio: number; label: string }> // Crop required water
> = {
  High: {
    High: { scoreRatio: 1.0, label: 'Optimal water availability for high-demand crop' },
    Medium: { scoreRatio: 0.9, label: 'Adequate water; ensure good drainage' },
    Low: { scoreRatio: 0.7, label: 'Excess water for low-demand crop; avoid waterlogging' },
  },
  Medium: {
    High: { scoreRatio: 0.6, label: 'Moderate water deficit for high-demand crop; supplementary irrigation needed' },
    Medium: { scoreRatio: 1.0, label: 'Optimal water availability for medium-demand crop' },
    Low: { scoreRatio: 0.9, label: 'Adequate water availability' },
  },
  Low: {
    High: { scoreRatio: 0.1, label: 'Severe water deficit; crop requires high water supply' },
    Medium: { scoreRatio: 0.5, label: 'Water stress likely during critical stages without supplementary irrigation' },
    Low: { scoreRatio: 1.0, label: 'Optimal water economy for low-water demand pulse/crop' },
  },
};

export const CROP_ANALYSIS_DISCLAIMERS = {
  SUITABILITY_NOTICE:
    'Suitability score is an agronomic index based on provided soil and climate parameters compared against TNAU / ICAR reference ranges. It is not a guaranteed yield prediction or crop insurance assessment.',
  SOIL_TEST_RECOMMENDATION:
    'Always verify soil nutrient levels with a certified district Soil Testing Laboratory (STL) before applying commercial fertilizers.',
};
