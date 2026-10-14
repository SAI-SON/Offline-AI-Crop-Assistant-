import { Config } from '../constants/config';

export interface PreprocessingContract {
  width: number;
  height: number;
  channels: number;
  dataType: 'UINT8';
  colorOrder: 'RGB';
  normalization: 'NONE';
  tensorShape: [number, number, number, number];
  bufferSizeBytes: number;
}

export const PREPROCESSING_CONTRACT: PreprocessingContract = {
  width: Config.INPUT_SIZE,
  height: Config.INPUT_SIZE,
  channels: Config.INPUT_CHANNELS,
  dataType: 'UINT8',
  colorOrder: 'RGB',
  normalization: 'NONE',
  tensorShape: [1, Config.INPUT_SIZE, Config.INPUT_SIZE, Config.INPUT_CHANNELS],
  bufferSizeBytes: Config.INPUT_SIZE * Config.INPUT_SIZE * Config.INPUT_CHANNELS, // 270,000 bytes
};

/**
 * Validates whether a preprocessed raw buffer complies with model input contract.
 */
export function validatePreprocessedBuffer(buffer: Uint8Array): { isValid: boolean; reason?: string } {
  if (!(buffer instanceof Uint8Array)) {
    return { isValid: false, reason: 'Buffer must be an instance of Uint8Array.' };
  }

  if (buffer.length !== PREPROCESSING_CONTRACT.bufferSizeBytes) {
    return {
      isValid: false,
      reason: `Buffer byte length ${buffer.length} does not match expected size ${PREPROCESSING_CONTRACT.bufferSizeBytes} (300*300*3).`,
    };
  }

  return { isValid: true };
}

/**
 * Dequantizes raw UINT8 model output value to floating point probability.
 *
 * Formula:
 *   probability = (raw_uint8 - zero_point) * scale
 * Where for this model: zero_point = 0, scale = 0.00390625 (1/256).
 */
export function dequantizeOutput(
  rawUint8: number,
  scale: number = 0.00390625,
  zeroPoint: number = 0,
): number {
  const prob = (rawUint8 - zeroPoint) * scale;
  return Math.max(0.0, Math.min(1.0, prob));
}
