export interface ParsedLabel {
  rawLabel: string;
  crop: string;
  disease: string;
  displayName: string;
  emoji: string;
  isHealthy: boolean;
}

const CROP_EMOJIS: Record<string, string> = {
  Tomato: '🍅',
  'Corn (Maize)': '🌽',
  Maize: '🌽',
  Soybean: '🌱',
  Cabbage: '🥬',
  Default: '🌿',
};

/**
 * Parses machine label string into human-readable crop and disease names.
 *
 * Example:
 *  "Tomato___Late_blight" -> { crop: "Tomato", disease: "Late Blight", displayName: "Tomato Late Blight", ... }
 *  "Corn_(maize)___Common_rust_" -> { crop: "Corn (Maize)", disease: "Common Rust", ... }
 */
export function parseLabel(rawLabel: string): ParsedLabel {
  if (!rawLabel) {
    return {
      rawLabel: '',
      crop: 'Unknown Crop',
      disease: 'Unknown Condition',
      displayName: 'Unknown',
      emoji: '🌿',
      isHealthy: false,
    };
  }

  const parts = rawLabel.split('___');
  let rawCrop = parts[0] || 'Unknown';
  let rawDisease = parts[1] || parts[0];

  // Clean crop name
  let crop = rawCrop;
  if (rawCrop === 'Corn_(maize)') {
    crop = 'Corn (Maize)';
  } else {
    crop = rawCrop.replace(/_/g, ' ').trim();
  }

  // Clean disease name
  let disease = rawDisease
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Handle specific label naming nuances
  if (rawDisease === 'Tomato_Yellow_Leaf_Curl_Virus') {
    disease = 'Tomato Yellow Leaf Curl Virus';
  } else if (rawDisease.includes('Cercospora_leaf_spot Gray_leaf_spot')) {
    disease = 'Gray Leaf Spot (Cercospora)';
  } else if (rawDisease.toLowerCase().endsWith('common_rust_') || disease === 'Common rust') {
    disease = 'Common Rust';
  }

  // Capitalize properly
  disease = capitalizeWords(disease);
  const isHealthy = disease.toLowerCase().includes('healthy');

  const emoji = CROP_EMOJIS[crop] || CROP_EMOJIS.Default;
  const displayName = isHealthy ? `${crop} (Healthy)` : `${crop} ${disease}`;

  return {
    rawLabel,
    crop,
    disease,
    displayName,
    emoji,
    isHealthy,
  };
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => {
      if (word.toUpperCase() === 'TYLCV' || word.toUpperCase() === 'MLND') {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
