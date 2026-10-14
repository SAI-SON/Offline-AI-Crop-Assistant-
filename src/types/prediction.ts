export interface Prediction {
  index: number;
  label: string;
  crop: string;
  disease: string;
  confidence: number; // 0.0 - 1.0
  rawUint8: number;   // 0 - 255
  rank?: number;
}

export interface ImageQualityReport {
  width: number;
  height: number;
  brightness: number;
  isAcceptable: boolean;
  isTooDark: boolean;
  isTooBright: boolean;
  validDimensions: boolean;
}

export interface InferenceResult {
  topPrediction: Prediction;
  predictions: Prediction[];
  rawValues: number[];
  inferenceMs: number;
  prepMs: number;
  quality: ImageQualityReport;
}

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
