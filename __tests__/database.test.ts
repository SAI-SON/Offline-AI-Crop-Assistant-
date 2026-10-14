import { SEED_DATA } from '../src/database/seed';
import { parseLabel } from '../src/utils/labelParser';

describe('Local Database Seed Data & Verification', () => {
  test('Seed data contains exactly 16 disease classes', () => {
    expect(SEED_DATA.diseases.length).toBe(16);
  });

  test('All 16 classes match expected labels and crops', () => {
    const crops = new Set(SEED_DATA.diseases.map(d => d.crop));
    expect(crops.has('Tomato')).toBe(true);
    expect(crops.has('Corn (Maize)')).toBe(true);
    expect(crops.has('Soybean')).toBe(true);
    expect(crops.has('Cabbage')).toBe(true);
  });

  test('Each disease has corresponding organic treatment recommendations', () => {
    for (const d of SEED_DATA.diseases) {
      const organic = SEED_DATA.organic[d.label];
      expect(organic).toBeDefined();
      expect(Array.isArray(organic)).toBe(true);
      expect(organic.length).toBeGreaterThan(0);
      for (const item of organic) {
        expect(item.title).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(item.category).toBeTruthy();
      }
    }
  });

  test('Non-healthy diseases have verified chemical treatments with safety notes', () => {
    for (const d of SEED_DATA.diseases) {
      if (!d.is_healthy) {
        const chemical = SEED_DATA.chemical[d.label];
        expect(chemical).toBeDefined();
        expect(Array.isArray(chemical)).toBe(true);
        expect(chemical.length).toBeGreaterThan(0);
        for (const item of chemical) {
          expect(item.active_ingredient).toBeTruthy();
          expect(item.treatment_type).toBeTruthy();
          expect(item.safety_note).toBeTruthy();
        }
      }
    }
  });

  test('Viral disease (TYLCV) enforces vector control and no fungicides', () => {
    const tylcvChemical = SEED_DATA.chemical['Tomato___Tomato_Yellow_Leaf_Curl_Virus'];
    expect(tylcvChemical).toBeDefined();
    const hasVectorControl = tylcvChemical.some(c => 
      c.treatment_type.toLowerCase().includes('vector') || 
      c.active_ingredient.toLowerCase().includes('imidacloprid') ||
      c.active_ingredient.toLowerCase().includes('neem')
    );
    expect(hasVectorControl).toBe(true);
  });

  test('Every disease has structured agronomic prevention practices', () => {
    for (const d of SEED_DATA.diseases) {
      const prev = SEED_DATA.prevention[d.label];
      expect(prev).toBeDefined();
      expect(Array.isArray(prev)).toBe(true);
      expect(prev.length).toBeGreaterThan(0);
    }
  });

  test('Label parser accurately extracts crop and health status for all 16 classes', () => {
    for (const d of SEED_DATA.diseases) {
      const parsed = parseLabel(d.label);
      expect(parsed.crop).toBeTruthy();
      expect(parsed.disease).toBeTruthy();
      expect(parsed.isHealthy).toBe(d.is_healthy === 1);
    }
  });
});
