// Self-contained in-memory AsyncStorage mock (names prefixed with mock for Jest hoisting)
const mockAsyncStorageStore = new Map();
const mockAsyncStorage = {
  getItem: jest.fn(async (key) => (mockAsyncStorageStore.has(key) ? mockAsyncStorageStore.get(key) : null)),
  setItem: jest.fn(async (key, value) => {
    mockAsyncStorageStore.set(key, value);
    return null;
  }),
  removeItem: jest.fn(async (key) => {
    mockAsyncStorageStore.delete(key);
    return null;
  }),
  clear: jest.fn(async () => {
    mockAsyncStorageStore.clear();
    return null;
  }),
  getAllKeys: jest.fn(async () => Array.from(mockAsyncStorageStore.keys())),
};
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

// Mock react-native NativeModules.TfliteCropCare
import { NativeModules } from 'react-native';
NativeModules.TfliteCropCare = {
  initModel: jest.fn().mockResolvedValue({ ready: true, modelName: 'plant_disease.tflite' }),
  predict: jest.fn().mockResolvedValue({
    topPrediction: { index: 3, label: 'Tomato___Late_blight', confidence: 0.942, rawUint8: 241 },
    predictions: [{ index: 3, label: 'Tomato___Late_blight', confidence: 0.942, rawUint8: 241 }],
    rawValues: new Array(16).fill(0),
    inferenceMs: 42,
    prepMs: 8,
    quality: {
      width: 800,
      height: 800,
      brightness: 120,
      isAcceptable: true,
      isTooDark: false,
      isTooBright: false,
      validDimensions: true,
    },
  }),
  getDiagnostics: jest.fn().mockResolvedValue({
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
    runtime: 'TensorFlow Lite 2.14.0 (Official Native)',
    status: 'READY',
  }),
};

// Mock react-native NativeModules.CropCareDatabase
const { Platform } = require('react-native');
Object.defineProperty(Platform, 'OS', { get: () => 'android' });

const mockDbStore = {
  scan_history: [],
  diseases: [],
  organic_treatments: [],
  chemical_treatments: [],
  prevention: [],
  autoId: 1,
};

NativeModules.CropCareDatabase = {
  openDatabase: jest.fn().mockResolvedValue({ opened: true, database: 'cropcare.db' }),
  executeSql: jest.fn(async (sql, args = []) => {
    const s = (sql || '').trim().toUpperCase();
    if (s.startsWith('INSERT INTO SCAN_HISTORY')) {
      mockDbStore.scan_history.push({
        id: mockDbStore.autoId++,
        image_uri: args[0],
        crop: args[1],
        disease: args[2],
        label: args[3],
        confidence: args[4],
        created_at: args[5],
      });
    } else if (s.startsWith('DELETE FROM SCAN_HISTORY WHERE ID = ?')) {
      const id = args[0];
      mockDbStore.scan_history = mockDbStore.scan_history.filter(item => item.id !== id);
    } else if (s.startsWith('DELETE FROM SCAN_HISTORY')) {
      mockDbStore.scan_history = [];
    }
    return { affected: 1 };
  }),
  executeBatch: jest.fn(async (batch) => {
    for (const item of (batch || [])) {
      await NativeModules.CropCareDatabase.executeSql(item.sql, item.args);
    }
    return { success: true, count: batch.length };
  }),
  query: jest.fn(async (sql, args = []) => {
    const s = (sql || '').trim().toUpperCase();
    if (s.includes('SCAN_HISTORY')) {
      return [...mockDbStore.scan_history].reverse();
    }
    if (s.includes('FROM DISEASES')) {
      return mockDbStore.diseases;
    }
    return [];
  }),
};


