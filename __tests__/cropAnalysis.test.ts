import { cropAnalysisService } from '../src/services/cropAnalysisService';
import { validateCropInput } from '../src/utils/cropAnalysisValidation';
import { CropRequirement, UserCropInput } from '../src/types/cropAnalysis';
import { sqliteService } from '../src/services/sqliteService';

// Mock sqliteService for deterministic isolated unit tests
jest.mock('../src/services/sqliteService', () => ({
  sqliteService: {
    query: jest.fn(),
    executeSql: jest.fn(),
    executeBatch: jest.fn(),
    openDatabase: jest.fn(),
    isDatabaseReady: jest.fn().mockReturnValue(true),
  },
}));

const mockRiceRequirement: CropRequirement = {
  id: 1,
  crop_name: 'Rice',
  min_ph: 5.5,
  max_ph: 7.5,
  min_temperature: 20.0,
  max_temperature: 37.0,
  min_humidity: 60.0,
  max_humidity: 85.0,
  min_rainfall: 1000.0,
  max_rainfall: 2500.0,
  min_n: 70.0,
  max_n: 120.0,
  min_p: 30.0,
  max_p: 60.0,
  min_k: 30.0,
  max_k: 60.0,
  organic_carbon_min: 0.5,
  organic_carbon_max: null,
  ec_min: 0.0,
  ec_max: 2.0,
  soil_texture: 'Clayey loam, silty clay, and heavy clay soils with good water retention capacity',
  water_requirement: 'High',
  season: 'Kharif, Rabi, Summer',
  notes: 'Standing water of 2-5 cm during vegetative phase',
  source: 'TNAU',
  source_url: 'https://www.agritech.tnau.ac.in/ta/pdf/AGRICULTURE.pdf',
  source_note: 'TNAU Agritech Portal Paddy Production Guide',
};

describe('Crop Analysis Module - Deterministic Engine & Service', () => {
  describe('Deterministic Test Case (Rice Benchmark)', () => {
    it('evaluates Rice conditions without crashing and produces score, status, and explanations', () => {
      // User input specified in requirement prompt:
      // N = 80, P = 40, K = 50, pH = 6.5, Temperature = 28, Humidity = 75, Rainfall = 1000
      const userInput: UserCropInput = {
        n: 80,
        p: 40,
        k: 50,
        ph: 6.5,
        temperature: 28,
        humidity: 75,
        rainfall: 1000,
        waterAvailability: 'High',
        soilTexture: 'Clay Loam',
      };

      const result = cropAnalysisService.analyzeCropSuitability(mockRiceRequirement, userInput);

      expect(result).toBeDefined();
      expect(result.crop).toBe('Rice');
      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);

      // Status must be one of the three valid categories
      expect(['Suitable', 'Moderately Suitable', 'Not Suitable']).toContain(result.status);

      // All 7 supplied numeric factors + texture + water availability should be evaluated
      const evaluatedFactors = result.factors.filter(f => f.status !== 'Unavailable');
      expect(evaluatedFactors.length).toBeGreaterThanOrEqual(7);

      // Strengths & explanations should be populated
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.guidance.length).toBeGreaterThan(0);

      // Verify individual factor evaluation: pH 6.5 is between 5.5 and 7.5 -> Suitable
      const phFactor = result.factors.find(f => f.factor === 'Soil pH');
      expect(phFactor).toBeDefined();
      expect(phFactor?.status).toBe('Suitable');
      expect(phFactor?.explanation).toContain('Soil pH (6.5)');

      // Nitrogen 80 is between 70 and 120 -> Suitable
      const nFactor = result.factors.find(f => f.factor === 'Nitrogen (N)');
      expect(nFactor).toBeDefined();
      expect(nFactor?.status).toBe('Suitable');

      // Rainfall 1000 is between 1000 and 2500 -> Suitable
      const rainFactor = result.factors.find(f => f.factor === 'Rainfall');
      expect(rainFactor).toBeDefined();
      expect(rainFactor?.status).toBe('Suitable');

      // Verify source attribution is preserved
      expect(result.sourceInfo?.source).toBe('TNAU');
      expect(result.sourceInfo?.sourceUrl).toBe(
        'https://www.agritech.tnau.ac.in/ta/pdf/AGRICULTURE.pdf'
      );
    });
  });

  describe('Missing Factor Handling & Dynamic Normalization', () => {
    it('normalizes the overall score across only the available factors when some are missing', () => {
      // User only supplies 3 factors: pH=6.5 (Suitable), Temp=28 (Suitable), Humidity=75 (Suitable)
      // All other factors are null/undefined
      const partialInput: UserCropInput = {
        ph: 6.5,
        temperature: 28,
        humidity: 75,
      };

      const result = cropAnalysisService.analyzeCropSuitability(mockRiceRequirement, partialInput);

      expect(result.overallScore).toBe(100); // 100% of available weights earned
      expect(result.status).toBe('Suitable');

      // Missing factors should be listed explicitly in missingFactors
      expect(result.missingFactors).toContain('Nitrogen (N)');
      expect(result.missingFactors).toContain('Phosphorus (P)');
      expect(result.missingFactors).toContain('Potassium (K)');
      expect(result.missingFactors).toContain('Rainfall');
      expect(result.missingFactors).toContain('Organic Carbon');
    });

    it('does not penalize the score if crop requirement lacks numeric bounds (null)', () => {
      const requirementWithNulls: CropRequirement = {
        ...mockRiceRequirement,
        min_rainfall: null,
        max_rainfall: null,
      };

      const input: UserCropInput = {
        ph: 6.5,
        temperature: 28,
        rainfall: 500, // even if user inputs, crop requirement has null so it shouldn't score
      };

      const result = cropAnalysisService.analyzeCropSuitability(requirementWithNulls, input);
      expect(result.missingFactors).toContain('Rainfall');
    });
  });

  describe('Boundary Condition Logic', () => {
    it('awards partial score and Moderately Suitable status when value is near boundary', () => {
      // pH range: 5.5 - 7.5. Span = 2.0. 15% tolerance = 0.3.
      // pH = 5.3 is within [5.5 - 0.3, 5.5) -> Moderately Suitable
      const input: UserCropInput = {
        ph: 5.3,
      };

      const result = cropAnalysisService.analyzeCropSuitability(mockRiceRequirement, input);
      const phFactor = result.factors.find(f => f.factor === 'Soil pH');

      expect(phFactor?.status).toBe('Moderately Suitable');
      expect(phFactor?.points).toBe(7.5); // 50% of weight 15
    });

    it('assigns 0 points and Not Suitable when value is clearly outside boundary', () => {
      // pH = 4.0 is far below 5.5 -> Not Suitable
      const input: UserCropInput = {
        ph: 4.0,
      };

      const result = cropAnalysisService.analyzeCropSuitability(mockRiceRequirement, input);
      const phFactor = result.factors.find(f => f.factor === 'Soil pH');

      expect(phFactor?.status).toBe('Not Suitable');
      expect(phFactor?.points).toBe(0);
      expect(result.overallScore).toBe(0);
      expect(result.status).toBe('Not Suitable');
    });
  });

  describe('Input Validation Rules', () => {
    it('accepts valid soil and climate parameters', () => {
      const valid = validateCropInput({
        ph: 6.5,
        humidity: 75,
        n: 100,
        p: 50,
        k: 60,
        rainfall: 800,
        temperature: 28,
        organicCarbon: 0.7,
        ec: 1.0,
      });
      expect(valid.isValid).toBe(true);
      expect(valid.errors.length).toBe(0);
    });

    it('rejects invalid pH values outside 0 to 14', () => {
      const invalidPh = validateCropInput({ ph: 15 });
      expect(invalidPh.isValid).toBe(false);
      expect(invalidPh.errors.some(e => e.field === 'ph')).toBe(true);

      const negativePh = validateCropInput({ ph: -1 });
      expect(negativePh.isValid).toBe(false);
      expect(negativePh.errors.some(e => e.field === 'ph')).toBe(true);
    });

    it('rejects relative humidity outside 0 to 100%', () => {
      const invalidHumidity = validateCropInput({ humidity: 105 });
      expect(invalidHumidity.isValid).toBe(false);
      expect(invalidHumidity.errors.some(e => e.field === 'humidity')).toBe(true);
    });

    it('rejects negative macronutrients and rainfall', () => {
      const negativeN = validateCropInput({ n: -5 });
      expect(negativeN.isValid).toBe(false);
      expect(negativeN.errors.some(e => e.field === 'n')).toBe(true);

      const negativeRain = validateCropInput({ rainfall: -50 });
      expect(negativeRain.isValid).toBe(false);
      expect(negativeRain.errors.some(e => e.field === 'rainfall')).toBe(true);
    });
  });

  describe('SQLite Service Operations', () => {
    it('fetches all crops from crop_requirements table', async () => {
      (sqliteService.query as jest.Mock).mockResolvedValueOnce([mockRiceRequirement]);

      const crops = await cropAnalysisService.getAllCrops();
      expect(crops.length).toBe(1);
      expect(crops[0].crop_name).toBe('Rice');
      expect(sqliteService.query).toHaveBeenCalledWith(
        'SELECT * FROM crop_requirements ORDER BY crop_name ASC;'
      );
    });

    it('saves completed analysis to crop_analysis_history', async () => {
      (sqliteService.executeSql as jest.Mock).mockResolvedValueOnce(true);

      const input: UserCropInput = { ph: 6.5 };
      const analysisResult = cropAnalysisService.analyzeCropSuitability(mockRiceRequirement, input);

      const saved = await cropAnalysisService.saveAnalysis(
        'Rice',
        analysisResult.overallScore,
        analysisResult.status,
        input,
        analysisResult
      );

      expect(saved).toBe(true);
      expect(sqliteService.executeSql).toHaveBeenCalled();
    });

    it('deletes history items and clears all history', async () => {
      (sqliteService.executeSql as jest.Mock).mockResolvedValue(true);

      const deleted = await cropAnalysisService.deleteHistoryItem(5);
      expect(deleted).toBe(true);
      expect(sqliteService.executeSql).toHaveBeenCalledWith(
        'DELETE FROM crop_analysis_history WHERE id = ?;',
        [5]
      );

      const cleared = await cropAnalysisService.clearAllHistory();
      expect(cleared).toBe(true);
      expect(sqliteService.executeSql).toHaveBeenCalledWith(
        'DELETE FROM crop_analysis_history;'
      );
    });
  });

  describe('Multi-Crop Recommendation Engine', () => {
    it('evaluates and ranks all available crops, sorting by highest suitability score', async () => {
      const mockMaizeRequirement: CropRequirement = {
        ...mockRiceRequirement,
        id: 2,
        crop_name: 'Maize',
        min_ph: 5.8,
        max_ph: 7.8,
        min_temperature: 18.0,
        max_temperature: 32.0,
        min_rainfall: 500.0,
        max_rainfall: 900.0,
        min_n: 90.0,
        max_n: 150.0,
      };

      const mockChickpeaRequirement: CropRequirement = {
        ...mockRiceRequirement,
        id: 3,
        crop_name: 'Chickpea',
        min_ph: 6.0,
        max_ph: 8.0,
        min_temperature: 15.0,
        max_temperature: 28.0,
        min_rainfall: 350.0,
        max_rainfall: 650.0, // 1000mm rainfall will severely penalize chickpea
      };

      (sqliteService.query as jest.Mock).mockResolvedValueOnce([
        mockRiceRequirement,
        mockMaizeRequirement,
        mockChickpeaRequirement,
      ]);

      const input: UserCropInput = {
        n: 80,
        p: 40,
        k: 50,
        ph: 6.5,
        temperature: 28,
        humidity: 75,
        rainfall: 1000,
        waterAvailability: 'High',
        soilTexture: 'Clay Loam',
      };

      const recommendations = await cropAnalysisService.recommendCrops(input);

      expect(recommendations.length).toBe(3);
      // Sorted descending by score
      expect(recommendations[0].score).toBeGreaterThanOrEqual(recommendations[1].score);
      expect(recommendations[1].score).toBeGreaterThanOrEqual(recommendations[2].score);

      // Rice should rank highest under wet paddy conditions (1000mm rain, high water, clay loam)
      expect(recommendations[0].crop.crop_name).toBe('Rice');
      expect(recommendations[0].score).toBeGreaterThan(80);
      expect(recommendations[0].score).toBeGreaterThan(recommendations[2].score);
    });
  });
});
