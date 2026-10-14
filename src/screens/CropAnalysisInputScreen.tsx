import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Colors } from '../constants/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { CropRequirement, SoilTexture, WaterAvailability, SeasonType, UserCropInput } from '../types/cropAnalysis';
import { validateCropInput } from '../utils/cropAnalysisValidation';
import { cropAnalysisService } from '../services/cropAnalysisService';

interface Props {
  route: any;
  navigation: any;
}

const SOIL_TEXTURE_OPTIONS: SoilTexture[] = [
  'Sandy',
  'Sandy Loam',
  'Loamy',
  'Clay Loam',
  'Clay',
  'Silty',
  'Unknown',
];

const WATER_OPTIONS: WaterAvailability[] = ['Low', 'Medium', 'High'];

const SEASON_OPTIONS: SeasonType[] = ['Kharif', 'Rabi', 'Summer', 'Year-round'];

export const CropAnalysisInputScreen: React.FC<Props> = ({ route, navigation }) => {
  const { crop } = route.params as { cropId: number; cropName: string; crop: CropRequirement };

  // Soil form state (strings so empty stays empty)
  const [n, setN] = useState<string>('');
  const [p, setP] = useState<string>('');
  const [k, setK] = useState<string>('');
  const [ph, setPh] = useState<string>('');
  const [organicCarbon, setOrganicCarbon] = useState<string>('');
  const [ec, setEc] = useState<string>('');
  const [selectedTexture, setSelectedTexture] = useState<SoilTexture>('Loamy');

  // Environmental form state
  const [temperature, setTemperature] = useState<string>('');
  const [humidity, setHumidity] = useState<string>('');
  const [rainfall, setRainfall] = useState<string>('');
  const [waterAvailability, setWaterAvailability] = useState<WaterAvailability>('Medium');
  const [season, setSeason] = useState<SeasonType>('Kharif');

  const [activeTab, setActiveTab] = useState<'soil' | 'environment'>('soil');

  const handleFillDemoValues = () => {
    // Helpful demo preset tailored to the selected crop for quick testing
    if (crop.crop_name === 'Rice') {
      setN('80');
      setP('40');
      setK('50');
      setPh('6.5');
      setOrganicCarbon('0.65');
      setEc('0.8');
      setSelectedTexture('Clay Loam');
      setTemperature('28');
      setHumidity('75');
      setRainfall('1000');
      setWaterAvailability('High');
      setSeason('Kharif');
    } else {
      setN(crop.min_n ? String(Math.round(crop.min_n * 1.1)) : '50');
      setP(crop.min_p ? String(Math.round(crop.min_p * 1.1)) : '30');
      setK(crop.min_k ? String(Math.round(crop.min_k * 1.1)) : '40');
      setPh(crop.min_ph ? String((crop.min_ph + (crop.max_ph || 7.0)) / 2) : '6.5');
      setOrganicCarbon('0.6');
      setEc('0.5');
      setSelectedTexture('Loamy');
      setTemperature(crop.min_temperature ? String(Math.round(crop.min_temperature + 5)) : '26');
      setHumidity(crop.min_humidity ? String(Math.round(crop.min_humidity + 10)) : '65');
      setRainfall(crop.min_rainfall ? String(Math.round(crop.min_rainfall * 1.1)) : '600');
      setWaterAvailability(crop.water_requirement as WaterAvailability || 'Medium');
      setSeason('Kharif');
    }
  };

  const parseOptionalNumber = (val: string): number | null => {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  };

  const handleRunAnalysis = () => {
    const userInput: UserCropInput = {
      n: parseOptionalNumber(n),
      p: parseOptionalNumber(p),
      k: parseOptionalNumber(k),
      ph: parseOptionalNumber(ph),
      organicCarbon: parseOptionalNumber(organicCarbon),
      ec: parseOptionalNumber(ec),
      soilTexture: selectedTexture,
      temperature: parseOptionalNumber(temperature),
      humidity: parseOptionalNumber(humidity),
      rainfall: parseOptionalNumber(rainfall),
      waterAvailability,
      season,
    };

    // Validate inputs
    const validation = validateCropInput(userInput);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => `• ${e.message}`).join('\n');
      Alert.alert('Invalid Input', `Please correct the following fields:\n\n${errorMessages}`);
      return;
    }

    // Run deterministic analysis
    const result = cropAnalysisService.analyzeCropSuitability(crop, userInput);

    navigation.navigate('CropAnalysisResult', {
      crop,
      userInput,
      result,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected Crop Banner */}
        <View style={styles.cropBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cropTitle}>🌾 {crop.crop_name}</Text>
            <Text style={styles.cropSubtitle}>
              Reference guidelines: {crop.source || 'TNAU'}
            </Text>
          </View>
          <TouchableOpacity style={styles.demoBtn} onPress={handleFillDemoValues}>
            <Text style={styles.demoBtnText}>⚡ Demo Values</Text>
          </TouchableOpacity>
        </View>

        {/* Section Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'soil' && styles.tabActive]}
            onPress={() => setActiveTab('soil')}
          >
            <Text style={[styles.tabText, activeTab === 'soil' && styles.tabTextActive]}>
              🧪 Soil Conditions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'environment' && styles.tabActive]}
            onPress={() => setActiveTab('environment')}
          >
            <Text style={[styles.tabText, activeTab === 'environment' && styles.tabTextActive]}>
              🌦 Environmental Factors
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.optionalNote}>
          ℹ <Text style={{ fontWeight: '700' }}>Optional Fields:</Text> Leave any parameter blank if unmeasured. The analysis dynamically normalizes based on your available data.
        </Text>

        {/* ================= TAB 1: SOIL CONDITIONS ================= */}
        {activeTab === 'soil' ? (
          <View>
            {/* Soil pH */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Soil pH (Acidity / Alkalinity)</Text>
                {crop.min_ph !== null && (
                  <Text style={styles.cropRefTag}>
                    Target: {crop.min_ph} – {crop.max_ph || 7.5}
                  </Text>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 6.5 (scale: 0 to 14)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={ph}
                onChangeText={setPh}
              />
            </View>

            {/* Nitrogen (N) */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Available Nitrogen (N)</Text>
                {crop.min_n !== null && (
                  <Text style={styles.cropRefTag}>
                    Target: {crop.min_n} – {crop.max_n || 120} kg/ha
                  </Text>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 80 kg/ha"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={n}
                onChangeText={setN}
              />
            </View>

            {/* Phosphorus (P) */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Available Phosphorus (P)</Text>
                {crop.min_p !== null && (
                  <Text style={styles.cropRefTag}>
                    Target: {crop.min_p} – {crop.max_p || 60} kg/ha
                  </Text>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 40 kg/ha"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={p}
                onChangeText={setP}
              />
            </View>

            {/* Potassium (K) */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Available Potassium (K)</Text>
                {crop.min_k !== null && (
                  <Text style={styles.cropRefTag}>
                    Target: {crop.min_k} – {crop.max_k || 60} kg/ha
                  </Text>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 50 kg/ha"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={k}
                onChangeText={setK}
              />
            </View>

            {/* Organic Carbon */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Soil Organic Carbon (%)</Text>
                {crop.organic_carbon_min !== null && (
                  <Text style={styles.cropRefTag}>Target: ≥ {crop.organic_carbon_min}%</Text>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 0.65 %"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={organicCarbon}
                onChangeText={setOrganicCarbon}
              />
            </View>

            {/* Electrical Conductivity (EC) */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Electrical Conductivity - EC (dS/m)</Text>
                {crop.ec_max !== null && (
                  <Text style={styles.cropRefTag}>Target: ≤ {crop.ec_max} dS/m</Text>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 0.8 dS/m"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={ec}
                onChangeText={setEc}
              />
            </View>

            {/* Soil Texture Selector */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Soil Texture</Text>
              {crop.soil_texture ? (
                <Text style={styles.textureHint}>Preferred: {crop.soil_texture}</Text>
              ) : null}
              <View style={styles.chipsWrap}>
                {SOIL_TEXTURE_OPTIONS.map(tex => (
                  <TouchableOpacity
                    key={tex}
                    style={[styles.chip, selectedTexture === tex && styles.chipActive]}
                    onPress={() => setSelectedTexture(tex)}
                  >
                    <Text
                      style={[styles.chipText, selectedTexture === tex && styles.chipTextActive]}
                    >
                      {tex}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* ================= TAB 2: ENVIRONMENTAL FACTORS ================= */
          <View>
            {/* Temperature */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Average Temperature (°C)</Text>
                {crop.min_temperature !== null && (
                  <Text style={styles.cropRefTag}>
                    Target: {crop.min_temperature} – {crop.max_temperature || 35}°C
                  </Text>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 28 °C"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={temperature}
                onChangeText={setTemperature}
              />
            </View>

            {/* Relative Humidity */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Relative Humidity (%)</Text>
                {crop.min_humidity !== null && (
                  <Text style={styles.cropRefTag}>
                    Target: {crop.min_humidity} – {crop.max_humidity || 80}%
                  </Text>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 75 % (0 - 100)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={humidity}
                onChangeText={setHumidity}
              />
            </View>

            {/* Expected Rainfall */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Seasonal Rainfall (mm)</Text>
                {crop.min_rainfall !== null && (
                  <Text style={styles.cropRefTag}>
                    Target: {crop.min_rainfall} – {crop.max_rainfall || 1500} mm
                  </Text>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 1000 mm"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={rainfall}
                onChangeText={setRainfall}
              />
            </View>

            {/* Water Availability Selector */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Irrigation / Water Availability</Text>
              {crop.water_requirement ? (
                <Text style={styles.textureHint}>
                  Crop demand: 💧 {crop.water_requirement}
                </Text>
              ) : null}
              <View style={styles.chipsWrap}>
                {WATER_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, waterAvailability === opt && styles.chipActive]}
                    onPress={() => setWaterAvailability(opt)}
                  >
                    <Text
                      style={[styles.chipText, waterAvailability === opt && styles.chipTextActive]}
                    >
                      {opt === 'High' ? '💧 High (Canal/Borewell)' : opt === 'Medium' ? '💦 Medium' : '🌵 Low (Rainfed)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Season Selector */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Cultivation Season</Text>
              {crop.season ? (
                <Text style={styles.textureHint}>Optimal seasons: 🗓 {crop.season}</Text>
              ) : null}
              <View style={styles.chipsWrap}>
                {SEASON_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, season === s && styles.chipActive]}
                    onPress={() => setSeason(s)}
                  >
                    <Text style={[styles.chipText, season === s && styles.chipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actions}>
          <PrimaryButton
            title={`Analyze ${crop.crop_name} Suitability`}
            icon="📊"
            variant="primary"
            onPress={handleRunAnalysis}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  cropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
  },
  cropTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cropSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  demoBtn: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  demoBtnText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  optionalNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    lineHeight: 16,
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  cropRefTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  textureHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actions: {
    marginTop: 10,
  },
});
