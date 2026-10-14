export const Config = {
  // Configurable confidence threshold (0.70 default, adjustable in Settings)
  CONFIDENCE_THRESHOLD: 0.70,

  // Model parameters (strictly matching plant_disease.tflite)
  INPUT_SIZE: 300,
  INPUT_CHANNELS: 3,
  TOTAL_CLASSES: 16,
  MODEL_NAME: 'plant_disease.tflite',
  LABELS_FILE: 'labels.txt',

  // Database
  DB_NAME: 'cropcare.db',

  // Local preferences storage keys
  STORAGE_KEYS: {
    CONFIDENCE_THRESHOLD: '@cropcare_confidence_threshold',
    LANGUAGE: '@cropcare_language',
  },

  // App details
  APP_NAME: 'CropCare AI',
  APP_TAGLINE: 'Offline AI Crop Disease Detection & Treatment Assistant',
  VERSION: '1.1.0',
};

export const AppConfig = {
  ...Config,
  confidence: {
    threshold: Config.CONFIDENCE_THRESHOLD,
  },
};

