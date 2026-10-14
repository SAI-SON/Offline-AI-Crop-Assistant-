import { FactorResult, FactorStatus } from '../types/cropAnalysis';
import { CROP_ANALYSIS_DISCLAIMERS } from '../constants/cropAnalysisConfig';

/**
 * Builds factual, deterministic explanation strings for numeric factors.
 */
export function buildNumericFactorExplanation(
  factorName: string,
  userValue: number,
  minVal: number | null,
  maxVal: number | null,
  unit: string,
  status: FactorStatus
): string {
  const unitSuffix = unit ? ` ${unit}` : '';
  const userValStr = `${userValue}${unitSuffix}`;
  const reqStr = formatRange(minVal, maxVal, unit);

  if (status === 'Suitable') {
    return `✓ ${factorName} (${userValStr}) is within the recommended suitable range (${reqStr}).`;
  }
  if (status === 'Moderately Suitable') {
    if (minVal !== null && userValue < minVal) {
      return `⚠ ${factorName} (${userValStr}) is marginally below the optimal boundary (${reqStr}).`;
    }
    if (maxVal !== null && userValue > maxVal) {
      return `⚠ ${factorName} (${userValStr}) is marginally above the optimal boundary (${reqStr}).`;
    }
    return `⚠ ${factorName} (${userValStr}) is near the boundary of the recommended range (${reqStr}).`;
  }
  if (status === 'Not Suitable') {
    if (minVal !== null && userValue < minVal) {
      return `❌ ${factorName} (${userValStr}) is significantly below the minimum requirement (${reqStr}).`;
    }
    if (maxVal !== null && userValue > maxVal) {
      return `❌ ${factorName} (${userValStr}) significantly exceeds the upper tolerance threshold (${reqStr}).`;
    }
    return `❌ ${factorName} (${userValStr}) falls outside the compatible range (${reqStr}).`;
  }

  return `ℹ ${factorName} data is unavailable for comparison.`;
}

function formatRange(min: number | null, max: number | null, unit: string): string {
  const unitSuffix = unit ? ` ${unit}` : '';
  if (min !== null && max !== null) {
    return `${min} – ${max}${unitSuffix}`;
  }
  if (min !== null) {
    return `≥ ${min}${unitSuffix}`;
  }
  if (max !== null) {
    return `≤ ${max}${unitSuffix}`;
  }
  return `Not specified in source`;
}

/**
 * Derives general agronomic guidance notes strictly based on evaluated limitations and strengths.
 * Never outputs arbitrary fertilizer dosages (e.g. "Apply 50 kg urea") without institutional basis.
 */
export function generateAgronomicGuidance(factors: FactorResult[], cropName: string): string[] {
  const guidance: string[] = [];

  const pHFactor = factors.find(f => f.factor === 'Soil pH');
  if (pHFactor && pHFactor.status !== 'Suitable' && typeof pHFactor.userValue === 'number') {
    if (pHFactor.userValue < 5.5) {
      guidance.push(
        'Soil pH is strongly acidic for ' +
          cropName +
          '. Consult your district Soil Testing Laboratory (STL) regarding lime/dolomite amendment feasibility.'
      );
    } else if (pHFactor.userValue > 8.0) {
      guidance.push(
        'Soil pH is alkaline. Application of well-decomposed FYM (Farm Yard Manure) and gypsum may help buffer soil alkalinity.'
      );
    }
  }

  const nFactor = factors.find(f => f.factor === 'Nitrogen (N)');
  if (nFactor && (nFactor.status === 'Moderately Suitable' || nFactor.status === 'Not Suitable')) {
    guidance.push(
      'Available Nitrogen is lower than optimal reference ranges for ' +
        cropName +
        '. Review soil-test recommendations before applying split doses of nitrogenous fertilizers.'
    );
  }

  const pFactor = factors.find(f => f.factor === 'Phosphorus (P)');
  if (pFactor && (pFactor.status === 'Moderately Suitable' || pFactor.status === 'Not Suitable')) {
    guidance.push(
      'Available Phosphorus level is below reference target. Basal application of phosphatic fertilizers (such as SSP or rock phosphate with PSB biofertilizer) is recommended.'
    );
  }

  const kFactor = factors.find(f => f.factor === 'Potassium (K)');
  if (kFactor && (kFactor.status === 'Moderately Suitable' || kFactor.status === 'Not Suitable')) {
    guidance.push(
      'Available Potassium is suboptimal. Adequate potash is critical for grain filling, disease resistance, and moisture stress tolerance.'
    );
  }

  const waterFactor = factors.find(f => f.factor === 'Water Availability');
  const rainFactor = factors.find(f => f.factor === 'Rainfall');
  if (
    (waterFactor && (waterFactor.status === 'Not Suitable' || waterFactor.status === 'Moderately Suitable')) ||
    (rainFactor && (rainFactor.status === 'Not Suitable' || rainFactor.status === 'Moderately Suitable'))
  ) {
    guidance.push(
      'Moisture constraints identified. Ensure assured supplemental irrigation scheduling, furrow diking, or drip system efficiency during critical growth stages.'
    );
  }

  const ocFactor = factors.find(f => f.factor === 'Organic Carbon');
  if (ocFactor && ocFactor.status !== 'Suitable' && typeof ocFactor.userValue === 'number' && ocFactor.userValue < 0.5) {
    guidance.push(
      'Soil Organic Carbon is below 0.5%. Incorporate in-situ green manure (Daincha/Sunnhemp) or 10-12 t/ha of well-rotted compost to improve soil biological health.'
    );
  }

  // Mandatory statutory advisory
  guidance.push(CROP_ANALYSIS_DISCLAIMERS.SOIL_TEST_RECOMMENDATION);

  return guidance;
}
