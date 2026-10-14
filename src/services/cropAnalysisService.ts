import { sqliteService } from './sqliteService';
import {
  CropRequirement,
  UserCropInput,
  CropAnalysisResult,
  FactorResult,
  FactorStatus,
  CropSuitabilityStatus,
  CropAnalysisHistoryRecord,
  CropRecommendationItem,
} from '../types/cropAnalysis';
import {
  CROP_ANALYSIS_WEIGHTS,
  SUITABILITY_THRESHOLDS,
  BOUNDARY_TOLERANCE_RATIO,
  SOIL_TEXTURE_COMPATIBILITY,
  WATER_AVAILABILITY_MATRIX,
} from '../constants/cropAnalysisConfig';
import {
  buildNumericFactorExplanation,
  generateAgronomicGuidance,
} from '../utils/cropAnalysisExplanation';

class CropAnalysisService {
  /**
   * Retrieves all supported crops from SQLite crop_requirements table.
   */
  async getAllCrops(): Promise<CropRequirement[]> {
    try {
      const crops = await sqliteService.query<CropRequirement>(
        'SELECT * FROM crop_requirements ORDER BY crop_name ASC;'
      );
      return crops || [];
    } catch (error) {
      console.error('CropAnalysisService.getAllCrops error:', error);
      return [];
    }
  }

  /**
   * Retrieves a single crop requirement by ID from SQLite.
   */
  async getCropById(id: number): Promise<CropRequirement | null> {
    try {
      const rows = await sqliteService.query<CropRequirement>(
        'SELECT * FROM crop_requirements WHERE id = ? LIMIT 1;',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('CropAnalysisService.getCropById error:', error);
      return null;
    }
  }

  /**
   * Retrieves a single crop requirement by name from SQLite.
   */
  async getCropByName(name: string): Promise<CropRequirement | null> {
    try {
      const rows = await sqliteService.query<CropRequirement>(
        'SELECT * FROM crop_requirements WHERE LOWER(crop_name) = LOWER(?) LIMIT 1;',
        [name.trim()]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('CropAnalysisService.getCropByName error:', error);
      return null;
    }
  }

  /**
   * Pure deterministic rule-based analysis engine comparing user soil & climate against crop requirements.
   */
  analyzeCropSuitability(
    crop: CropRequirement,
    input: UserCropInput
  ): CropAnalysisResult {
    const factors: FactorResult[] = [];
    const missingFactors: string[] = [];

    let totalAvailableWeight = 0;
    let totalEarnedScore = 0;

    // Helper for numeric factors
    const evaluateNumeric = (
      factorName: string,
      category: 'soil' | 'environment',
      userVal: number | undefined | null,
      minVal: number | null,
      maxVal: number | null,
      weight: number,
      unit: string
    ) => {
      // If crop has no requirement specified in source, or user didn't supply value:
      if (
        userVal === undefined ||
        userVal === null ||
        isNaN(userVal) ||
        (minVal === null && maxVal === null)
      ) {
        missingFactors.push(factorName);
        factors.push({
          factor: factorName,
          category,
          userValue: userVal !== undefined && userVal !== null ? `${userVal} ${unit}` : null,
          requirement: formatReqRange(minVal, maxVal, unit),
          status: 'Unavailable',
          points: 0,
          maxPoints: weight,
          explanation: `ℹ ${factorName} was not provided or not specified in reference guide. Excluded from score calculation.`,
        });
        return;
      }

      totalAvailableWeight += weight;

      let status: FactorStatus = 'Suitable';
      let earnedPoints = weight;

      const span =
        minVal !== null && maxVal !== null
          ? Math.max(1, maxVal - minVal)
          : minVal !== null
          ? minVal * 0.5
          : maxVal !== null
          ? maxVal * 0.5
          : 10;
      const tolerance = span * BOUNDARY_TOLERANCE_RATIO;

      if (minVal !== null && userVal < minVal) {
        if (userVal >= minVal - tolerance) {
          status = 'Moderately Suitable';
          earnedPoints = weight * 0.5;
        } else {
          status = 'Not Suitable';
          earnedPoints = 0;
        }
      } else if (maxVal !== null && userVal > maxVal) {
        if (userVal <= maxVal + tolerance) {
          status = 'Moderately Suitable';
          earnedPoints = weight * 0.5;
        } else {
          status = 'Not Suitable';
          earnedPoints = 0;
        }
      }

      totalEarnedScore += earnedPoints;

      factors.push({
        factor: factorName,
        category,
        userValue: userVal,
        requirement: formatReqRange(minVal, maxVal, unit),
        status,
        points: Math.round(earnedPoints * 10) / 10,
        maxPoints: weight,
        explanation: buildNumericFactorExplanation(
          factorName,
          userVal,
          minVal,
          maxVal,
          unit,
          status
        ),
      });
    };

    // 1. Soil pH
    evaluateNumeric(
      'Soil pH',
      'soil',
      input.ph,
      crop.min_ph,
      crop.max_ph,
      CROP_ANALYSIS_WEIGHTS.ph,
      ''
    );

    // 2. Nitrogen (N)
    evaluateNumeric(
      'Nitrogen (N)',
      'soil',
      input.n,
      crop.min_n,
      crop.max_n,
      CROP_ANALYSIS_WEIGHTS.n,
      'kg/ha'
    );

    // 3. Phosphorus (P)
    evaluateNumeric(
      'Phosphorus (P)',
      'soil',
      input.p,
      crop.min_p,
      crop.max_p,
      CROP_ANALYSIS_WEIGHTS.p,
      'kg/ha'
    );

    // 4. Potassium (K)
    evaluateNumeric(
      'Potassium (K)',
      'soil',
      input.k,
      crop.min_k,
      crop.max_k,
      CROP_ANALYSIS_WEIGHTS.k,
      'kg/ha'
    );

    // 5. Temperature
    evaluateNumeric(
      'Temperature',
      'environment',
      input.temperature,
      crop.min_temperature,
      crop.max_temperature,
      CROP_ANALYSIS_WEIGHTS.temperature,
      '°C'
    );

    // 6. Humidity
    evaluateNumeric(
      'Relative Humidity',
      'environment',
      input.humidity,
      crop.min_humidity,
      crop.max_humidity,
      CROP_ANALYSIS_WEIGHTS.humidity,
      '%'
    );

    // 7. Rainfall
    evaluateNumeric(
      'Rainfall',
      'environment',
      input.rainfall,
      crop.min_rainfall,
      crop.max_rainfall,
      CROP_ANALYSIS_WEIGHTS.rainfall,
      'mm'
    );

    // 8. Organic Carbon
    evaluateNumeric(
      'Organic Carbon',
      'soil',
      input.organicCarbon,
      crop.organic_carbon_min,
      crop.organic_carbon_max,
      CROP_ANALYSIS_WEIGHTS.organicCarbon,
      '%'
    );

    // 9. Electrical Conductivity (EC)
    evaluateNumeric(
      'Electrical Conductivity (EC)',
      'soil',
      input.ec,
      crop.ec_min,
      crop.ec_max,
      CROP_ANALYSIS_WEIGHTS.ec,
      'dS/m'
    );

    // 10. Soil Texture
    const weightTexture = CROP_ANALYSIS_WEIGHTS.soilTexture;
    if (input.soilTexture && input.soilTexture !== 'Unknown' && crop.soil_texture) {
      totalAvailableWeight += weightTexture;
      const textureConfig = SOIL_TEXTURE_COMPATIBILITY[input.soilTexture];
      const cropTextLower = crop.soil_texture.toLowerCase();

      let status: FactorStatus = 'Not Suitable';
      let earned = 0;
      let exp = `❌ Selected texture (${input.soilTexture}) is suboptimal for ${crop.crop_name}. Preferred: ${crop.soil_texture}.`;

      if (textureConfig.compatibleKeywords.some(kw => cropTextLower.includes(kw))) {
        status = 'Suitable';
        earned = weightTexture;
        exp = `✓ Soil texture (${input.soilTexture}) matches favorable physical conditions for ${crop.crop_name}.`;
      } else if (textureConfig.moderateKeywords.some(kw => cropTextLower.includes(kw))) {
        status = 'Moderately Suitable';
        earned = weightTexture * 0.5;
        exp = `⚠ Soil texture (${input.soilTexture}) is acceptable with good soil tillage and management.`;
      }

      totalEarnedScore += earned;
      factors.push({
        factor: 'Soil Texture',
        category: 'soil',
        userValue: input.soilTexture,
        requirement: crop.soil_texture,
        status,
        points: Math.round(earned * 10) / 10,
        maxPoints: weightTexture,
        explanation: exp,
      });
    } else {
      missingFactors.push('Soil Texture');
      factors.push({
        factor: 'Soil Texture',
        category: 'soil',
        userValue: input.soilTexture || null,
        requirement: crop.soil_texture || 'Not specified',
        status: 'Unavailable',
        points: 0,
        maxPoints: weightTexture,
        explanation: 'ℹ Soil texture was not provided or not defined.',
      });
    }

    // 11. Water Availability
    const weightWater = CROP_ANALYSIS_WEIGHTS.waterAvailability;
    if (input.waterAvailability && crop.water_requirement) {
      totalAvailableWeight += weightWater;
      const reqWaterKey = crop.water_requirement.trim();
      const match =
        WATER_AVAILABILITY_MATRIX[input.waterAvailability]?.[reqWaterKey] || {
          scoreRatio: 0.5,
          label: 'Moderate alignment with crop water needs',
        };

      const earned = weightWater * match.scoreRatio;
      totalEarnedScore += earned;

      let status: FactorStatus = 'Suitable';
      if (match.scoreRatio < 0.4) status = 'Not Suitable';
      else if (match.scoreRatio < 0.9) status = 'Moderately Suitable';

      factors.push({
        factor: 'Water Availability',
        category: 'environment',
        userValue: input.waterAvailability,
        requirement: `${crop.water_requirement} requirement`,
        status,
        points: Math.round(earned * 10) / 10,
        maxPoints: weightWater,
        explanation: `${status === 'Suitable' ? '✓' : status === 'Moderately Suitable' ? '⚠' : '❌'} ${match.label}.`,
      });
    } else {
      missingFactors.push('Water Availability');
      factors.push({
        factor: 'Water Availability',
        category: 'environment',
        userValue: input.waterAvailability || null,
        requirement: crop.water_requirement || 'Not specified',
        status: 'Unavailable',
        points: 0,
        maxPoints: weightWater,
        explanation: 'ℹ Water availability was not specified.',
      });
    }

    // 12. Overall Normalized Score
    const overallScore =
      totalAvailableWeight > 0
        ? Math.min(100, Math.max(0, Math.round((totalEarnedScore / totalAvailableWeight) * 100)))
        : 0;

    let status: CropSuitabilityStatus = 'Not Suitable';
    if (overallScore >= SUITABILITY_THRESHOLDS.SUITABLE_MIN) {
      status = 'Suitable';
    } else if (overallScore >= SUITABILITY_THRESHOLDS.MODERATE_MIN) {
      status = 'Moderately Suitable';
    }

    // Categorize strengths & limitations
    const strengths = factors
      .filter(f => f.status === 'Suitable')
      .map(f => f.explanation);

    const limitations = factors
      .filter(f => f.status === 'Not Suitable' || f.status === 'Moderately Suitable')
      .map(f => f.explanation);

    // Derive guidance
    const guidance = generateAgronomicGuidance(factors, crop.crop_name);

    return {
      crop: crop.crop_name,
      overallScore,
      status,
      factors,
      strengths,
      limitations,
      missingFactors,
      guidance,
      sourceInfo: {
        source: crop.source,
        sourceUrl: crop.source_url,
        sourceNote: crop.source_note,
      },
    };
  }

  /**
   * Persists a completed crop suitability evaluation into SQLite crop_analysis_history table.
   */
  async saveAnalysis(
    cropName: string,
    score: number,
    status: CropSuitabilityStatus,
    input: UserCropInput,
    result: CropAnalysisResult
  ): Promise<boolean> {
    try {
      const sql = `
        INSERT INTO crop_analysis_history (crop_name, score, status, input_data, result_data, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
      `;
      const createdAt = new Date().toISOString();
      const inputJson = JSON.stringify(input);
      const resultJson = JSON.stringify(result);

      await sqliteService.executeSql(sql, [
        cropName,
        score,
        status,
        inputJson,
        resultJson,
        createdAt,
      ]);
      return true;
    } catch (error) {
      console.error('CropAnalysisService.saveAnalysis error:', error);
      throw error;
    }
  }

  /**
   * Fetches saved crop analysis history from SQLite.
   */
  async getHistory(): Promise<CropAnalysisHistoryRecord[]> {
    try {
      const rows = await sqliteService.query<CropAnalysisHistoryRecord>(
        'SELECT * FROM crop_analysis_history ORDER BY created_at DESC;'
      );
      return rows || [];
    } catch (error) {
      console.error('CropAnalysisService.getHistory error:', error);
      return [];
    }
  }

  /**
   * Deletes a single history record by ID.
   */
  async deleteHistoryItem(id: number): Promise<boolean> {
    try {
      await sqliteService.executeSql('DELETE FROM crop_analysis_history WHERE id = ?;', [id]);
      return true;
    } catch (error) {
      console.error('CropAnalysisService.deleteHistoryItem error:', error);
      return false;
    }
  }

  /**
   * Clears all crop analysis history.
   */
  async clearAllHistory(): Promise<boolean> {
    try {
      await sqliteService.executeSql('DELETE FROM crop_analysis_history;');
      return true;
    } catch (error) {
      console.error('CropAnalysisService.clearAllHistory error:', error);
      return false;
    }
  }

  /**
   * Evaluates all crops in SQLite knowledge base against user soil & climate inputs.
   * Returns a ranked list of recommended crops sorted by overall suitability score (highest first).
   */
  async recommendCrops(userInput: UserCropInput): Promise<CropRecommendationItem[]> {
    const allCrops = await this.getAllCrops();
    const recommendations: CropRecommendationItem[] = allCrops.map(crop => {
      const analysis = this.analyzeCropSuitability(crop, userInput);
      return {
        crop,
        score: analysis.overallScore,
        status: analysis.status,
        strengthsCount: analysis.strengths.length,
        limitationsCount: analysis.limitations.length,
        analysis,
      };
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }
}

function formatReqRange(min: number | null, max: number | null, unit: string): string {
  if (min !== null && max !== null) return `${min} - ${max} ${unit}`.trim();
  if (min !== null) return `≥ ${min} ${unit}`.trim();
  if (max !== null) return `≤ ${max} ${unit}`.trim();
  return 'Not specified';
}

export const cropAnalysisService = new CropAnalysisService();
