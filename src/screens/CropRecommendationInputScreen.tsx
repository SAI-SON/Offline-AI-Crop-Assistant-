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
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { SoilTexture, WaterAvailability, SeasonType, UserCropInput } from '../types/cropAnalysis';
import { validateCropInput } from '../utils/cropAnalysisValidation';
import { cropAnalysisService } from '../services/cropAnalysisService';

interface Props {
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

export const CropRecommendationInputScreen: React.FC<Props> = ({ navigation }) => {
  // Soil Form State
  const [n, setN] = useState<string>('');
  const [p, setP] = useState<string>('');
  const [k, setK] = useState<string>('');
  const [ph, setPh] = useState<string>('');
  const [organicCarbon, setOrganicCarbon] = useState<string>('');
  const [ec, setEc] = useState<string>('');
  const [selectedTexture, setSelectedTexture] = useState<SoilTexture>('Loamy');

  // Environmental Form State
  const [temperature, setTemperature] = useState<string>('');
  const [humidity, setHumidity] = useState<string>('');
  const [rainfall, setRainfall] = useState<string>('');
  const [waterAvailability, setWaterAvailability] = useState<WaterAvailability>('Medium');
  const [season, setSeason] = useState<SeasonType>('Kharif');

  const [activeTab, setActiveTab] = useState<'soil' | 'environment'>('soil');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFillDemoValues = () => {
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
  };

  const parseOptionalNumber = (val: string): number | null => {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  };

  const handleRecommendCrops = async () => {
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

    try {
      setLoading(true);
      const recommendations = await cropAnalysisService.recommendCrops(userInput);

      navigation.navigate('CropRecommendationResult', {
        userInput,
        recommendations,
      });
    } catch (err: any) {
      Alert.alert('Analysis Error', 'Failed to rank crops: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>🧪 Crop Recommendation by Soil</Text>
            <Text style={styles.bannerSubtitle}>
              Provide your soil analysis & climate to find the highest-ranking suitable crops.
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
              🌱 Soil Test Properties
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
          ℹ <Text style={{ fontWeight: '700' }}>100% Offline Multi-Crop Matching:</Text> Evaluates all 10 TNAU / ICAR reference crops simultaneously. Optional fields can be left blank.
        </Text>

        {/* ================= TAB 1: SOIL TEST ================= */}
        {activeTab === 'soil' ? (
          <View>
            {/* Soil pH */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Soil pH</Text>
              <Text style={styles.inputHint}>Acidity/Alkalinity rating (Optimal for most crops: 6.0 – 7.5)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 6.5 (0 to 14)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={ph}
                onChangeText={setPh}
              />
            </View>

            {/* Nitrogen (N) */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Available Nitrogen (N)</Text>
              <Text style={styles.inputHint}>Available N in kg/hectare from soil test</Text>
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
              <Text style={styles.inputLabel}>Available Phosphorus (P)</Text>
              <Text style={styles.inputHint}>Available P in kg/hectare from soil test</Text>
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
              <Text style={styles.inputLabel}>Available Potassium (K)</Text>
              <Text style={styles.inputHint}>Available K in kg/hectare from soil test</Text>
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
              <Text style={styles.inputLabel}>Organic Carbon (%)</Text>
              <Text style={styles.inputHint}>Desired range: ≥ 0.5% for active biological activity</Text>
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
              <Text style={styles.inputLabel}>Electrical Conductivity - EC (dS/m)</Text>
              <Text style={styles.inputHint}>Soil salinity indicator (&lt; 1.5 dS/m preferred)</Text>
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
              <Text style={styles.inputLabel}>Predominant Soil Texture</Text>
              <View style={styles.chipsWrap}>
                {SOIL_TEXTURE_OPTIONS.map(tex => (
                  <TouchableOpacity
                    key={tex}
                    style={[styles.chip, selectedTexture === tex && styles.chipActive]}
                    onPress={() => setSelectedTexture(tex)}
                  >
                    <Text style={[styles.chipText, selectedTexture === tex && styles.chipTextActive]}>
                      {tex}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* ================= TAB 2: ENVIRONMENT ================= */
          <View>
            {/* Temperature */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Average Temperature (°C)</Text>
              <Text style={styles.inputHint}>Expected growing season temperature</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 28 °C"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={temperature}
                onChangeText={setTemperature}
              />
            </View>

            {/* Humidity */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Relative Humidity (%)</Text>
              <Text style={styles.inputHint}>Average humidity level during growing season</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 75 %"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={humidity}
                onChangeText={setHumidity}
              />
            </View>

            {/* Rainfall */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Expected Seasonal Rainfall (mm)</Text>
              <Text style={styles.inputHint}>Total seasonal rainfall in millimeters</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 1000 mm"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={rainfall}
                onChangeText={setRainfall}
              />
            </View>

            {/* Water Availability */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Water & Irrigation Source</Text>
              <View style={styles.chipsWrap}>
                {WATER_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, waterAvailability === opt && styles.chipActive]}
                    onPress={() => setWaterAvailability(opt)}
                  >
                    <Text style={[styles.chipText, waterAvailability === opt && styles.chipTextActive]}>
                      {opt === 'High' ? '💧 High (Canal/Borewell)' : opt === 'Medium' ? '💦 Medium' : '🌵 Low (Rainfed)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Season */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Target Cultivation Season</Text>
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
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <PrimaryButton
              title="Find Recommended Crops"
              icon="🌾"
              variant="primary"
              onPress={handleRecommendCrops}
            />
          )}
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
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    elevation: 2,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14532D',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#166534',
    marginTop: 3,
    lineHeight: 16,
  },
  demoBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginLeft: 8,
  },
  demoBtnText: {
    color: '#15803D',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  inputHint: {
    fontSize: 11,
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
