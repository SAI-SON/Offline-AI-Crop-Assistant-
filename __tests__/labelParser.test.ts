import { parseLabel } from '../src/utils/labelParser';
import { assessConfidence } from '../src/utils/confidence';

describe('Label Parser & Formatting', () => {
  test('Parses Tomato Late Blight correctly', () => {
    const parsed = parseLabel('Tomato___Late_blight');
    expect(parsed.crop).toBe('Tomato');
    expect(parsed.disease).toBe('Late Blight');
    expect(parsed.emoji).toBe('🍅');
    expect(parsed.isHealthy).toBe(false);
  });

  test('Parses Corn Common Rust correctly', () => {
    const parsed = parseLabel('Corn_(maize)___Common_rust_');
    expect(parsed.crop).toBe('Corn (Maize)');
    expect(parsed.disease).toBe('Common Rust');
    expect(parsed.emoji).toBe('🌽');
    expect(parsed.isHealthy).toBe(false);
  });

  test('Parses Tomato Yellow Leaf Curl Virus correctly', () => {
    const parsed = parseLabel('Tomato___Tomato_Yellow_Leaf_Curl_Virus');
    expect(parsed.crop).toBe('Tomato');
    expect(parsed.disease).toBe('Tomato Yellow Leaf Curl Virus');
    expect(parsed.isHealthy).toBe(false);
  });

  test('Identifies healthy plants accurately', () => {
    const parsedTomato = parseLabel('Tomato___healthy');
    expect(parsedTomato.isHealthy).toBe(true);

    const parsedSoybean = parseLabel('Soybean___healthy');
    expect(parsedSoybean.isHealthy).toBe(true);
    expect(parsedSoybean.emoji).toBe('🌱');
  });

  test('Confidence assessment flags low confidence as uncertain', () => {
    const high = assessConfidence(0.92);
    expect(high.level).toBe('high');
    expect(high.isUncertain).toBe(false);

    const uncertain = assessConfidence(0.35); // below default threshold 0.50
    expect(uncertain.level).toBe('uncertain');
    expect(uncertain.isUncertain).toBe(true);
  });
});
