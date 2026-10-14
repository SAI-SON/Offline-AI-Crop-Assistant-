const fs = require('fs');
const path = require('path');

declare const __dirname: string;

describe('Model Contract & Integrity', () => {
  const modelPath = path.resolve(__dirname, '../assets/models/plant_disease.tflite');
  const labelsPath = path.resolve(__dirname, '../assets/models/labels.txt');
  const diseaseInfoPath = path.resolve(__dirname, '../assets/data/diseaseInfo.json');

  test('TFLite model file exists and is not empty', () => {
    expect(fs.existsSync(modelPath)).toBe(true);
    const stats = fs.statSync(modelPath);
    expect(stats.size).toBeGreaterThan(10 * 1024 * 1024); // ~11 MB
  });

  test('Labels file exists and contains exactly 16 classes', () => {
    expect(fs.existsSync(labelsPath)).toBe(true);
    const content = fs.readFileSync(labelsPath, 'utf8');
    const labels = content.split('\n').map((l: string) => l.trim()).filter(Boolean);
    expect(labels.length).toBe(16);

    // Verify critical expected labels
    expect(labels).toContain('Tomato___Late_blight');
    expect(labels).toContain('Tomato___healthy');
    expect(labels).toContain('Corn_(maize)___Common_rust_');
    expect(labels).toContain('Cabbage___Black_Rot');
    expect(labels).toContain('Soybean___healthy');
  });

  test('Disease knowledge database contains records for all 16 classes', () => {
    expect(fs.existsSync(diseaseInfoPath)).toBe(true);
    const rawData = fs.readFileSync(diseaseInfoPath, 'utf8');
    const diseaseData = JSON.parse(rawData);

    const content = fs.readFileSync(labelsPath, 'utf8');
    const labels = content.split('\n').map((l: string) => l.trim()).filter(Boolean);

    for (const label of labels) {
      expect(diseaseData[label]).toBeDefined();
      expect(diseaseData[label].crop).toBeTruthy();
      expect(diseaseData[label].disease).toBeTruthy();
      expect(Array.isArray(diseaseData[label].symptoms)).toBe(true);
      expect(Array.isArray(diseaseData[label].prevention)).toBe(true);
      expect(diseaseData[label].disclaimer).toBeTruthy();
    }
  });
});
