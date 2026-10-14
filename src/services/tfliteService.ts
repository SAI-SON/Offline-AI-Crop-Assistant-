import { NativeModules, Platform } from 'react-native';
import { InferenceResult, ModelDiagnostics, DiseaseDetail } from '../types';
import diseaseInfoData from '../../assets/data/diseaseInfo.json';

const { TfliteCropCare } = NativeModules;

class TfliteService {
  private isReady: boolean = false;
  private cachedDiagnostics: ModelDiagnostics | null = null;
  private diseaseDatabase: Record<string, DiseaseDetail> = diseaseInfoData as any;

  /**
   * Initializes the native TensorFlow Lite interpreter and loads plant_disease.tflite.
   */
  async initModel(): Promise<boolean> {
    if (this.isReady) {
      return true;
    }

    if (Platform.OS !== 'android' || !TfliteCropCare) {
      console.warn('TfliteCropCare native module is only available on Android native builds.');
      return false;
    }

    try {
      const result = await TfliteCropCare.initModel();
      this.isReady = !!result?.ready;
      return this.isReady;
    } catch (error) {
      console.error('TfliteService.initModel failed:', error);
      this.isReady = false;
      throw error;
    }
  }

  /**
   * Runs offline inference on a leaf image.
   *
   * @param imageUri File or content URI of the leaf image
   */
  async predict(imageUri: string): Promise<InferenceResult> {
    if (!this.isReady) {
      await this.initModel();
    }

    if (!TfliteCropCare) {
      throw new Error('TfliteCropCare native module not found');
    }

    try {
      const result: InferenceResult = await TfliteCropCare.predict(imageUri);
      return result;
    } catch (error) {
      console.error('TfliteService.predict error:', error);
      throw error;
    }
  }

  /**
   * Retrieves model runtime diagnostics metadata.
   */
  async getDiagnostics(): Promise<ModelDiagnostics> {
    if (!TfliteCropCare) {
      return {
        modelFile: 'plant_disease.tflite',
        modelSizeBytes: 11559310,
        modelSizeFormatted: '11.02 MB',
        inputShape: [1, 300, 300, 3],
        inputType: 'UINT8',
        outputShape: [1, 16],
        outputType: 'UINT8',
        labelsCount: 16,
        outputScale: 0.00390625,
        outputZeroPoint: 0,
        runtime: 'TensorFlow Lite (Native Android)',
        status: 'UNAVAILABLE_PLATFORM',
        databaseStatus: 'UNAVAILABLE_PLATFORM',
        totalDiseasesInDb: 16,
      };
    }

    try {
      const diag: ModelDiagnostics = await TfliteCropCare.getDiagnostics();
      this.cachedDiagnostics = diag;
      return diag;
    } catch (error) {
      console.error('TfliteService.getDiagnostics error:', error);
      throw error;
    }
  }

  /**
   * Retrieves local symptoms and prevention guidance for a given disease label.
   */
  getDiseaseInfo(label: string): DiseaseDetail {
    const info = this.diseaseDatabase[label];
    if (info) {
      return info;
    }

    // Default safe fallback if label is unlisted
    return {
      label,
      crop: 'Unknown Crop',
      disease: label,
      status: 'diseased',
      description: 'Plant disease details could not be retrieved from local database.',
      symptoms: ['Visual abnormality on leaf foliage'],
      prevention: [
        'Inspect plant closely for signs of pests or fungal spores',
        'Isolate infected crop from healthy neighboring plants',
        'Avoid overhead watering to limit pathogen spread',
      ],
      disclaimer: 'Consult your local agricultural extension service for official diagnosis and guidance.',
    };
  }

  /**
   * Checks if model is currently ready for inference.
   */
  isModelReady(): boolean {
    return this.isReady;
  }
}

export const tfliteService = new TfliteService();
