export interface ScanHistoryRecord {
  id: number;
  image_uri: string;
  crop: string;
  disease: string;
  label: string;
  confidence: number;
  created_at: string; // ISO datetime string
}
