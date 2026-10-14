import { historyService } from '../src/services/historyService';

describe('HistoryService Storage CRUD', () => {
  beforeEach(async () => {
    await historyService.clearAllHistory();
  });

  test('Starts with empty history list', async () => {
    const list = await historyService.getScans();
    expect(list).toEqual([]);
  });

  test('Saves a scan and loads it back', async () => {
    const success = await historyService.saveScan({
      imageUri: 'file:///data/leaf_1.jpg',
      label: 'Tomato___Late_blight',
      crop: 'Tomato',
      disease: 'Late Blight',
      confidence: 0.942,
      isHealthy: false,
      inferenceMs: 38,
    });

    expect(success).toBe(true);

    const list = await historyService.getScans();
    expect(list.length).toBe(1);
    expect(list[0].crop).toBe('Tomato');
    expect(list[0].disease).toBe('Late Blight');
    expect(list[0].confidence).toBeCloseTo(0.942);
  });

  test('Deletes an individual scan by id', async () => {
    await historyService.saveScan({
      imageUri: 'file:///data/leaf_1.jpg',
      label: 'Tomato___healthy',
      crop: 'Tomato',
      disease: 'Healthy',
      confidence: 0.98,
      isHealthy: true,
    });

    await historyService.saveScan({
      imageUri: 'file:///data/leaf_2.jpg',
      label: 'Corn_(maize)___Common_rust_',
      crop: 'Corn (Maize)',
      disease: 'Common Rust',
      confidence: 0.91,
      isHealthy: false,
    });

    let list = await historyService.getScans();
    expect(list.length).toBe(2);

    const targetId = list[0].id;
    const deleted = await historyService.deleteScan(targetId);
    expect(deleted).toBe(true);

    list = await historyService.getScans();
    expect(list.length).toBe(1);
    expect(list[0].id).not.toBe(targetId);
  });

  test('Clears all history', async () => {
    await historyService.saveScan({
      imageUri: 'file:///data/leaf.jpg',
      label: 'Cabbage___Black_Rot',
      crop: 'Cabbage',
      disease: 'Black Rot',
      confidence: 0.88,
      isHealthy: false,
    });

    await historyService.clearAllHistory();
    const list = await historyService.getScans();
    expect(list.length).toBe(0);
  });
});
