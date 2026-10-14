import { UserCropInput } from '../types/cropAnalysis';

export interface ValidationError {
  field: keyof UserCropInput;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates user-entered soil and environmental numbers against physical/agronomic limits.
 * Optional fields (undefined/null/empty) are permitted and ignored during validation.
 */
export function validateCropInput(input: UserCropInput): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. pH validation: 0 - 14
  if (input.ph !== undefined && input.ph !== null && !isNaN(input.ph)) {
    if (input.ph < 0 || input.ph > 14) {
      errors.push({
        field: 'ph',
        message: 'Soil pH must be between 0.0 and 14.0 (neutral is 7.0).',
      });
    }
  }

  // 2. Humidity: 0 - 100%
  if (input.humidity !== undefined && input.humidity !== null && !isNaN(input.humidity)) {
    if (input.humidity < 0 || input.humidity > 100) {
      errors.push({
        field: 'humidity',
        message: 'Relative humidity must be between 0% and 100%.',
      });
    }
  }

  // 3. Macronutrients (N, P, K): >= 0
  if (input.n !== undefined && input.n !== null && !isNaN(input.n) && input.n < 0) {
    errors.push({
      field: 'n',
      message: 'Available Nitrogen (N) cannot be negative.',
    });
  }

  if (input.p !== undefined && input.p !== null && !isNaN(input.p) && input.p < 0) {
    errors.push({
      field: 'p',
      message: 'Available Phosphorus (P) cannot be negative.',
    });
  }

  if (input.k !== undefined && input.k !== null && !isNaN(input.k) && input.k < 0) {
    errors.push({
      field: 'k',
      message: 'Available Potassium (K) cannot be negative.',
    });
  }

  // 4. Rainfall: >= 0
  if (input.rainfall !== undefined && input.rainfall !== null && !isNaN(input.rainfall) && input.rainfall < 0) {
    errors.push({
      field: 'rainfall',
      message: 'Expected seasonal rainfall (mm) cannot be negative.',
    });
  }

  // 5. Temperature: -10 to 60 °C
  if (input.temperature !== undefined && input.temperature !== null && !isNaN(input.temperature)) {
    if (input.temperature < -10 || input.temperature > 60) {
      errors.push({
        field: 'temperature',
        message: 'Average temperature must be within a realistic agricultural range (-10°C to 60°C).',
      });
    }
  }

  // 6. Organic Carbon: >= 0
  if (input.organicCarbon !== undefined && input.organicCarbon !== null && !isNaN(input.organicCarbon) && input.organicCarbon < 0) {
    errors.push({
      field: 'organicCarbon',
      message: 'Soil Organic Carbon (%) cannot be negative.',
    });
  }

  // 7. Electrical Conductivity (EC): >= 0
  if (input.ec !== undefined && input.ec !== null && !isNaN(input.ec) && input.ec < 0) {
    errors.push({
      field: 'ec',
      message: 'Electrical Conductivity (dS/m) cannot be negative.',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
