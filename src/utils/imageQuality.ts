import { ImageQualityReport } from '../types';

export interface QualityValidationResult {
  isAcceptable: boolean;
  warnings: string[];
  recommendations: string[];
}

/**
 * Assesses image quality report returned by camera/native preprocessing.
 */
export function evaluateImageQuality(report?: ImageQualityReport): QualityValidationResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!report) {
    return {
      isAcceptable: true,
      warnings: [],
      recommendations: [],
    };
  }

  if (!report.validDimensions || report.width < 100 || report.height < 100) {
    warnings.push('Image resolution is very small.');
    recommendations.push('Capture the photo closer to the leaf using higher resolution.');
  }

  if (report.isTooDark) {
    warnings.push('Image is too dark to clearly identify leaf patterns.');
    recommendations.push('Improve lighting or take the photo in direct daylight.');
  }

  if (report.isTooBright) {
    warnings.push('Image is washed out or overexposed.');
    recommendations.push('Avoid direct camera flash reflection on glossy leaves.');
  }

  const isAcceptable = warnings.length === 0;

  return {
    isAcceptable,
    warnings,
    recommendations,
  };
}
