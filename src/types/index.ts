export * from './disease';
export * from './prediction';
export * from './history';
export * from './cropAnalysis';

export interface ModelDiagnostics {
  modelFile: string;
  modelSizeBytes: number;
  modelSizeFormatted: string;
  inputShape: number[];
  inputType: string;
  outputShape: number[];
  outputType: string;
  labelsCount: number;
  outputScale: number;
  outputZeroPoint: number;
  runtime: string;
  status: string;
  databaseStatus: string;
  totalDiseasesInDb: number;
  lastInferenceMs?: number;
}
