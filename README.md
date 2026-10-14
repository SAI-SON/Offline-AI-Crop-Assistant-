# 🌱 Offline-AI-Crop-Assistant (CropCare AI) – Offline AI Crop Disease Detection & Treatment Assistant

**CropCare AI** is a production-grade, 100% offline-first Android mobile application built with **React Native (v0.87.1)**, **TypeScript**, **Google TensorFlow Lite (Native Runtime v2.14.0)**, and an on-device **SQLite relational database (`cropcare.db`)**.

The application detects foliar crop diseases directly on-device using a quantized MobileNetV2 neural network and retrieves authoritative, localized agronomic treatment protocols (Organic, Biological, Chemical, Prevention, and Safety) directly from its local SQLite database—**without internet, cellular connectivity, or any cloud API**.

---

## 📌 Architecture: Separation of Concerns

CropCare AI adheres strictly to the architectural separation of concerns:

1. **AI Model Role**: The on-device TensorFlow Lite model is responsible **strictly and solely for disease classification** from leaf pixels. The model never generates hallucinated or unverified treatment recommendations.
2. **Local Database Role**: All treatment information (Organic/cultural management, biological options, active chemical ingredients, safety notes, pre-harvest intervals, and field prevention) is retrieved exclusively from the on-device **SQLite database (`cropcare.db`)**. Guidance is curated from verified institutional agricultural sources (**Tamil Nadu Agricultural University - TNAU** and **Indian Council of Agricultural Research - ICAR**).

```
                      ┌───────────────────────────┐
                      │  📷 Camera / 🖼️ Gallery    │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    Image Preprocessing    │
                      │   300 × 300 RGB UINT8     │
                      │  Direct Native ByteBuffer │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │  TFLite MobileNet Model   │
                      │  (Google Native Runtime)  │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │  Disease Classification   │
                      │     (16 Target Classes)   │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │   SQLite Database Lookup  │
                      │       (cropcare.db)       │
                      └─────────────┬─────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│🌿 Organic/Cultural│     │🧪 Chemical & PHI  │     │🛡️ Agronomic Field │
│  Non-chemical     │     │ Active Ingredients│     │     Prevention    │
└───────────────────┘     └───────────────────┘     └───────────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │   📜 Local Scan History   │
                      │    (SQLite scan_history)  │
                      └───────────────────────────┘
```

---

## ⚡ 100% Offline-First Guarantee

The application requires **zero internet access** after installation:
- **Airplane Mode Ready**: Fully functional with Wi-Fi turned OFF and Mobile Data turned OFF.
- **Zero Cloud APIs**: No Supabase, Firebase, AWS, Gemini, or remote inference endpoints.
- **Zero Image Uploads**: Captured images are processed entirely in RAM/local storage.
- **Persistent Offline Database**: The SQLite database (`cropcare.db`) is embedded and transactionally initialized on first launch.

---

## 💾 Local SQLite Database Schema (`cropcare.db`)

All agricultural management knowledge is organized in structured relational tables created and maintained via the native Android SQLite module:

### 1. `diseases` Table
Stores classification targets and baseline botanical context:
```sql
CREATE TABLE IF NOT EXISTS diseases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT UNIQUE NOT NULL,
    crop TEXT NOT NULL,
    disease_name TEXT NOT NULL,
    description TEXT NOT NULL,
    is_healthy INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_diseases_label ON diseases(label);
CREATE INDEX IF NOT EXISTS idx_diseases_crop ON diseases(crop);
```

### 2. `organic_treatments` Table
Stores non-chemical, cultural, biological, and sanitation practices:
```sql
CREATE TABLE IF NOT EXISTS organic_treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    disease_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- 'cultural', 'sanitation', 'biological', 'soil', 'irrigation', 'monitoring'
    FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_organic_disease_id ON organic_treatments(disease_id);
```

### 3. `chemical_treatments` Table
Stores institutional active ingredients, treatment classifications, and strict safety notes:
```sql
CREATE TABLE IF NOT EXISTS chemical_treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    disease_id INTEGER NOT NULL,
    treatment_type TEXT NOT NULL, -- 'Fungicide', 'Bactericide', 'Vector Control', etc.
    active_ingredient TEXT NOT NULL,
    description TEXT NOT NULL,
    safety_note TEXT NOT NULL,
    FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_chemical_disease_id ON chemical_treatments(disease_id);
```

### 4. `prevention` Table
Stores long-term agronomic practices and field sanitation protocols:
```sql
CREATE TABLE IF NOT EXISTS prevention (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    disease_id INTEGER NOT NULL,
    prevention TEXT NOT NULL,
    FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_prevention_disease_id ON prevention(disease_id);
```

### 5. `scan_history` Table
Stores on-device scan history with timestamps, image references, and diagnosis metrics:
```sql
CREATE TABLE IF NOT EXISTS scan_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_uri TEXT NOT NULL,
    crop TEXT NOT NULL,
    disease TEXT NOT NULL,
    label TEXT NOT NULL,
    confidence REAL NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON scan_history(created_at);
```

---

## 🛡️ Agricultural Safety & Statutory Advisories

CropCare AI adheres strictly to agricultural safety standards:

1. **Active Ingredients, Not Unverified Brands**: The chemical management tab recommends standardized active ingredients (e.g., *Mancozeb 75% WP*, *Copper Oxychloride 50% WP*, *Azoxystrobin 23% SC*, *Streptocycline*) rather than unverified commercial brand names.
2. **Mandatory Statutory Safety Advisory**: Every chemical consultation presents a prominent safety notice reminding farmers to wear PPE (respirator/mask, gloves, eye protection), observe Pre-Harvest Intervals (PHI), check registration for their specific crop, and follow local agricultural extension instructions.
3. **Viral Disease Warning (TYLCV)**:
   - For `Tomato___Tomato_Yellow_Leaf_Curl_Virus`, the app displays a critical statutory notice:
   > 🛑 **Viral Disease Notice**: There is NO direct chemical cure for the virus itself. Fungicide sprays are ineffective against viruses. Management must focus on roguing infected plants and controlling vector whiteflies (*Bemisia tabaci*) with yellow sticky traps, insect nets, and systemic vector control.
4. **Healthy Leaf Management**: When a leaf is classified as healthy, the chemical tab confirms that no chemical fungicides or sprays are necessary, highlighting weekly scouting and root-zone drip irrigation instead.

---

## 🔬 Model Contract & Specifications

- **Model File**: `assets/models/plant_disease.tflite`
- **Model Size**: 11.02 MB (11,559,310 bytes)
- **Architecture**: MobileNetV2 (Quantized UINT8)
- **Input Tensor**: `[1, 300, 300, 3]`, `UINT8`, RGB order.
- **Normalization**: **NONE**. Pixel values are passed directly as $[0 \dots 255]$ without dividing by 255 and without ImageNet mean subtraction.
- **Output Tensor**: `[1, 16]`, `UINT8` ($0 \dots 255$).
- **Dequantization**: $\text{prob} = (\text{raw\_uint8} - 0) \times 0.00390625 = \frac{\text{raw\_uint8}}{256.0}$.
- **Runtime**: Official Native Google TensorFlow Lite C++ runtime (`2.14.0`) with 4 threads and XNNPACK delegate.

---

## 🌿 16 Supported Crop Disease Classes

| # | Model Label | Crop | Condition | Health Status |
|---|---|---|---|---|
| 0 | `Tomato___healthy` | Tomato 🍅 | Healthy | 🌱 Healthy |
| 1 | `Tomato___Septoria_leaf_spot` | Tomato 🍅 | Septoria Leaf Spot | 🦠 Diseased |
| 2 | `Tomato___Bacterial_spot` | Tomato 🍅 | Bacterial Spot | 🦠 Diseased |
| 3 | `Tomato___Late_blight` | Tomato 🍅 | Late Blight | 🦠 Diseased |
| 4 | `Cabbage___healthy` | Cabbage 🥬 | Healthy | 🌱 Healthy |
| 5 | `Tomato___Spider_mites` | Tomato 🍅 | Two-Spotted Spider Mites | 🦠 Diseased |
| 6 | `Tomato___Leaf_Mold` | Tomato 🍅 | Leaf Mold | 🦠 Diseased |
| 7 | `Tomato___Tomato_Yellow_Leaf_Curl_Virus` | Tomato 🍅 | Tomato Yellow Leaf Curl Virus (TYLCV) | 🦠 Viral Disease |
| 8 | `Soybean___Frogeye_Leaf_Spot` | Soybean 🌱 | Frogeye Leaf Spot | 🦠 Diseased |
| 9 | `Soybean___Downy_Mildew` | Soybean 🌱 | Downy Mildew | 🦠 Diseased |
| 10 | `Corn_(maize)___Common_rust_` | Corn (Maize) 🌽 | Common Rust | 🦠 Diseased |
| 11 | `Corn_(maize)___healthy` | Corn (Maize) 🌽 | Healthy | 🌱 Healthy |
| 12 | `Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot` | Corn (Maize) 🌽 | Gray Leaf Spot | 🦠 Diseased |
| 13 | `Corn_(maize)___Lethal_Necrosis` | Corn (Maize) 🌽 | Maize Lethal Necrosis (MLND) | 🦠 Diseased |
| 14 | `Soybean___healthy` | Soybean 🌱 | Healthy | 🌱 Healthy |
| 15 | `Cabbage___Black_Rot` | Cabbage 🥬 | Black Rot | 🦠 Diseased |

---

## 🧪 Automated Testing Suite

The repository includes 24 automated unit and integration tests across 6 test suites:

```bash
npm test
```

### Test Coverage:
1. `__tests__/database.test.ts`: Validates 16 seeded disease records, relational treatment links, organic categories, chemical safety notes, viral vector control enforcement, and label parsing.
2. `__tests__/modelContract.test.ts`: Verifies model file size (~11 MB), label counts, and disease metadata mapping.
3. `__tests__/imagePreprocessor.test.ts`: Verifies $[1, 300, 300, 3]$ UINT8 tensor shape, buffer size (270,000 bytes), and dequantization math.
4. `__tests__/historyService.test.ts`: Verifies SQLite CRUD operations (`saveScan`, `getScans`, `deleteScan`, `clearAllHistory`).
5. `__tests__/labelParser.test.ts`: Verifies human-readable parsing for all 16 labels.
6. `__tests__/App.test.tsx`: Verifies top-level application mounting and navigation container rendering.

---

## 📱 Build & Deploy Instructions

### Prerequisites:
- Node.js >= 22
- JDK 17
- Android SDK (API 34+)

### 1. Bundle JavaScript for Standalone Offline APK:
```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android\app\src\main\assets\index.android.bundle --assets-dest android\app\src\main\res\
```

### 2. Compile Debug APK:
```bash
cd android
./gradlew assembleDebug
```
Output APK location:
`android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Install to Connected Android Device:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### 4. Launch Application:
```bash
adb shell am start -n com.cropcareai/.MainActivity
```

---

## 📋 Technology Stack Summary
- **UI Framework**: React Native 0.87.1
- **Language**: TypeScript & Java Native Modules
- **AI Runtime**: Google TensorFlow Lite 2.14.0 (Official Native Runtime with XNNPACK)
- **Database**: Android SQLite (`cropcare.db`) via custom native module
- **Testing**: Jest 29
- **Treatment Guidance**: TNAU & ICAR verified agricultural protocols
