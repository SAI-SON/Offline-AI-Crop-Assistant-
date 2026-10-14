import {
  PREPROCESSING_CONTRACT,
  validatePreprocessedBuffer,
  dequantizeOutput,
} from '../src/utils/imagePreprocessor';

describe('Image Preprocessor & Tensor Contract', () => {
  test('Preprocessing contract matches MobileNetV2 specification', () => {
    expect(PREPROCESSING_CONTRACT.width).toBe(300);
    expect(PREPROCESSING_CONTRACT.height).toBe(300);
    expect(PREPROCESSING_CONTRACT.channels).toBe(3);
    expect(PREPROCESSING_CONTRACT.dataType).toBe('UINT8');
    expect(PREPROCESSING_CONTRACT.colorOrder).toBe('RGB');
    expect(PREPROCESSING_CONTRACT.normalization).toBe('NONE');
    expect(PREPROCESSING_CONTRACT.tensorShape).toEqual([1, 300, 300, 3]);
    expect(PREPROCESSING_CONTRACT.bufferSizeBytes).toBe(300 * 300 * 3); // 270,000
  });

  test('validatePreprocessedBuffer accepts exact 270,000 Uint8Array buffer', () => {
    const validBuffer = new Uint8Array(270000);
    // Fill sample values in 0-255 range
    validBuffer[0] = 255;
    validBuffer[100] = 128;
    validBuffer[269999] = 10;

    const result = validatePreprocessedBuffer(validBuffer);
    expect(result.isValid).toBe(true);
  });

  test('validatePreprocessedBuffer rejects incorrect buffer lengths or types', () => {
    const shortBuffer = new Uint8Array(200000);
    const shortResult = validatePreprocessedBuffer(shortBuffer);
    expect(shortResult.isValid).toBe(false);

    const wrongType: any = [1, 2, 3];
    const typeResult = validatePreprocessedBuffer(wrongType);
    expect(typeResult.isValid).toBe(false);
  });

  test('Output dequantization properly converts uint8 to probability', () => {
    // scale = 0.00390625 (= 1/256), zero_point = 0
    expect(dequantizeOutput(0)).toBe(0);
    expect(dequantizeOutput(256)).toBe(1);
    expect(dequantizeOutput(128)).toBeCloseTo(0.5, 2);
    expect(dequantizeOutput(254)).toBeCloseTo(0.9922, 3);
  });
});
