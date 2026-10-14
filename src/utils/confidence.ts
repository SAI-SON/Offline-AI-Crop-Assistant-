import { Config } from '../constants/config';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'uncertain';

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  percentageText: string;
  isUncertain: boolean;
  score: number; // 0.0 - 1.0
  color: string;
}

/**
 * Assesses model confidence score against configured thresholds.
 */
export function assessConfidence(score: number, customThreshold?: number): ConfidenceAssessment {
  const threshold = customThreshold ?? Config.CONFIDENCE_THRESHOLD;
  const safeScore = Math.max(0.0, Math.min(1.0, score || 0));
  const percentage = (safeScore * 100).toFixed(1);
  const percentageText = `${percentage}%`;

  if (safeScore < threshold) {
    return {
      level: 'uncertain',
      percentageText,
      isUncertain: true,
      score: safeScore,
      color: '#E65100', // Warning amber
    };
  }

  if (safeScore >= 0.85) {
    return {
      level: 'high',
      percentageText,
      isUncertain: false,
      score: safeScore,
      color: '#2E7D32', // Strong green
    };
  } else if (safeScore >= 0.65) {
    return {
      level: 'medium',
      percentageText,
      isUncertain: false,
      score: safeScore,
      color: '#558B2F', // Olive green
    };
  } else {
    return {
      level: 'low',
      percentageText,
      isUncertain: false,
      score: safeScore,
      color: '#F57C00', // Light orange
    };
  }
}
