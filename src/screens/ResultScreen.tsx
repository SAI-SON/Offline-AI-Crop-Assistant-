import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { parseLabel } from '../utils/labelParser';
import { assessConfidence } from '../utils/confidence';
import { historyService } from '../services/historyService';
import { diseaseService } from '../services/diseaseService';
import { InferenceResult, DiseaseDetail, FullDiseaseData } from '../types';

interface Props {
  route: any;
  navigation: any;
}

type FilterType = 'all' | 'organic' | 'chemical' | 'prevention';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  cultural: { bg: '#E8F5E9', text: '#2E7D32' },
  sanitation: { bg: '#E0F2F1', text: '#00695C' },
  biological: { bg: '#F3E5F5', text: '#7B1FA2' },
  soil: { bg: '#EFEBE9', text: '#5D4037' },
  irrigation: { bg: '#E1F5FE', text: '#0277BD' },
  monitoring: { bg: '#FFF8E1', text: '#E65100' },
};

export const ResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { imageUri, inferenceResult, diseaseInfo, fullDiseaseData: initialDiseaseData } =
    route.params as {
      imageUri: string;
      inferenceResult: InferenceResult;
      diseaseInfo?: DiseaseDetail;
      fullDiseaseData?: FullDiseaseData | null;
    };

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [diseaseData, setDiseaseData] = useState<FullDiseaseData | null>(initialDiseaseData || null);
  const [loadingData, setLoadingData] = useState<boolean>(!initialDiseaseData);
  const [saved, setSaved] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const topPrediction = inferenceResult.topPrediction;
  const parsed = parseLabel(topPrediction.label);
  const confidenceAssessment = assessConfidence(topPrediction.confidence);
  const isViral = topPrediction.label === 'Tomato___Tomato_Yellow_Leaf_Curl_Virus';

  // Load from SQLite if not passed via route
  useEffect(() => {
    let isMounted = true;
    if (!diseaseData) {
      (async () => {
        try {
          const data = await diseaseService.getDiseaseByLabel(topPrediction.label);
          if (isMounted && data) {
            setDiseaseData(data);
          }
        } catch (e) {
          console.warn('Failed to load disease data from SQLite:', e);
        } finally {
          if (isMounted) setLoadingData(false);
        }
      })();
    } else {
      setLoadingData(false);
    }
    return () => {
      isMounted = false;
    };
  }, [topPrediction.label]);

  // Top 3 other possibilities
  const topPossibilities = (inferenceResult.predictions || []).slice(0, 3);

  const handleSaveResult = async () => {
    if (saved) return;
    try {
      setSaving(true);
      await historyService.saveScan({
        imageUri,
        label: topPrediction.label,
        crop: parsed.crop,
        disease: parsed.disease,
        confidence: topPrediction.confidence,
        isHealthy: parsed.isHealthy,
        inferenceMs: inferenceResult.inferenceMs,
      });
      setSaved(true);
      Alert.alert('Saved', Strings.result.savedSuccess);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save scan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const showOrganic = activeFilter === 'all' || activeFilter === 'organic';
  const showChemical = activeFilter === 'all' || activeFilter === 'chemical';
  const showPrevention = activeFilter === 'all' || activeFilter === 'prevention';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Leaf Image & Crop Badge */}
        {imageUri ? (
          <View style={styles.imageCard}>
            <Image source={{ uri: imageUri }} style={styles.leafImage} resizeMode="cover" />
            <View style={styles.cropBadge}>
              <Text style={styles.cropEmoji}>{parsed.emoji}</Text>
              <Text style={styles.cropName}>{parsed.crop}</Text>
            </View>
          </View>
        ) : null}

        {/* Diagnosis Header Card */}
        <View style={[styles.card, parsed.isHealthy ? styles.healthyBorder : styles.diseaseBorder]}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusTag,
                parsed.isHealthy ? styles.statusTagHealthy : styles.statusTagDisease,
              ]}
            >
              <Text
                style={[
                  styles.statusTagText,
                  parsed.isHealthy ? styles.statusTextHealthy : styles.statusTextDisease,
                ]}
              >
                {parsed.isHealthy ? '🌱 ' + Strings.result.healthyStatus : '🦠 ' + Strings.result.diseasedStatus}
              </Text>
            </View>

            <Text style={styles.latencyText}>⚡ {inferenceResult.inferenceMs ? `${inferenceResult.inferenceMs.toFixed(0)} ms` : 'Offline'}</Text>
          </View>

          <Text style={styles.diseaseTitle}>{parsed.disease}</Text>

          {/* Uncertainty Banner */}
          {confidenceAssessment.isUncertain && (
            <View style={styles.uncertainBanner}>
              <Text style={styles.uncertainIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.uncertainTitle}>{Strings.result.uncertainStatus}</Text>
                <Text style={styles.uncertainText}>{Strings.result.uncertainNotice}</Text>
              </View>
            </View>
          )}

          {/* Confidence Progress Bar */}
          <ConfidenceBar confidence={topPrediction.confidence} />
        </View>

        {/* Filter Quick-Selector Chips */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Treatment Guidance (SQLite Local DB):</Text>
          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={[styles.chip, activeFilter === 'all' && styles.chipActive]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.chipText, activeFilter === 'all' && styles.chipTextActive]}>
                📋 All Treatments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, activeFilter === 'organic' && styles.chipActive]}
              onPress={() => setActiveFilter('organic')}
            >
              <Text style={[styles.chipText, activeFilter === 'organic' && styles.chipTextActive]}>
                🌿 Organic
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, activeFilter === 'chemical' && styles.chipActive]}
              onPress={() => setActiveFilter('chemical')}
            >
              <Text style={[styles.chipText, activeFilter === 'chemical' && styles.chipTextActive]}>
                🧪 Chemical
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, activeFilter === 'prevention' && styles.chipActive]}
              onPress={() => setActiveFilter('prevention')}
            >
              <Text style={[styles.chipText, activeFilter === 'prevention' && styles.chipTextActive]}>
                🛡 Prevention
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loadingData && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading treatments from local SQLite database...</Text>
          </View>
        )}

        {/* ================= 1. ORGANIC TREATMENTS SECTION ================= */}
        {showOrganic && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.mainSectionHeading}>🌿 Organic & Non-Chemical Management</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>TNAU / ICAR</Text>
              </View>
            </View>

            {diseaseData?.organicTreatments && diseaseData.organicTreatments.length > 0 ? (
              diseaseData.organicTreatments.map((treatment, idx) => {
                const catStyle = CATEGORY_COLORS[treatment.category.toLowerCase()] || {
                  bg: '#F5F5F5',
                  text: '#424242',
                };
                return (
                  <View key={treatment.id || idx} style={styles.treatmentCard}>
                    <View style={styles.treatmentHeader}>
                      <View style={[styles.catBadge, { backgroundColor: catStyle.bg }]}>
                        <Text style={[styles.catBadgeText, { color: catStyle.text }]}>
                          {treatment.category.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.treatmentTitle}>{treatment.title}</Text>
                    <Text style={styles.treatmentDesc}>{treatment.description}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.card}>
                <Text style={styles.emptyNote}>
                  {parsed.isHealthy
                    ? '🌱 Plant is healthy! Maintain regular organic mulching and clean water.'
                    : 'No specific organic treatments listed for this condition.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ================= 2. CHEMICAL TREATMENTS SECTION ================= */}
        {showChemical && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.mainSectionHeading}>🧪 Chemical Management & Safety</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>Active Ingredients</Text>
              </View>
            </View>

            {/* Viral Disease Special Notice */}
            {isViral && (
              <View style={styles.viralCard}>
                <Text style={styles.viralIcon}>🛑</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.viralTitle}>{Strings.result.viralNoticeTitle}</Text>
                  <Text style={styles.viralText}>{Strings.result.viralNoticeText}</Text>
                </View>
              </View>
            )}

            {/* Mandatory Safety Notice */}
            <View style={styles.advisoryCard}>
              <Text style={styles.advisoryIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.advisoryTitle}>{Strings.result.safetyTitle}</Text>
                <Text style={styles.advisoryText}>{Strings.result.chemicalAdvisory}</Text>
              </View>
            </View>

            {/* Chemical Treatment Cards */}
            {parsed.isHealthy ? (
              <View style={styles.card}>
                <Text style={styles.healthyMessage}>
                  🌱 Plant is healthy! No chemical applications or fungicides are necessary.
                </Text>
              </View>
            ) : diseaseData?.chemicalTreatments && diseaseData.chemicalTreatments.length > 0 ? (
              diseaseData.chemicalTreatments.map((chem, idx) => (
                <View key={chem.id || idx} style={styles.treatmentCard}>
                  <View style={styles.chemHeader}>
                    <View style={styles.chemBadge}>
                      <Text style={styles.chemBadgeText}>{chem.treatment_type}</Text>
                    </View>
                    <Text style={styles.activeIngredientText}>🧪 {chem.active_ingredient}</Text>
                  </View>

                  <Text style={styles.treatmentDesc}>{chem.description}</Text>

                  {chem.safety_note && (
                    <View style={styles.safetyBox}>
                      <Text style={styles.safetyNoteText}>
                        🛡️ <Text style={{ fontWeight: '700' }}>Safety & PHI:</Text> {chem.safety_note}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.card}>
                <Text style={styles.emptyNote}>
                  No specific chemical applications recommended in the database for this condition.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ================= 3. PREVENTION SECTION ================= */}
        {showPrevention && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.mainSectionHeading}>🛡️ Field Prevention & Agronomic Practices</Text>
            </View>

            {parsed.isHealthy ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>🌿 Good Agricultural Practices</Text>
                {Strings.result.healthyPractices.map((practice, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bulletDotCheck}>✓</Text>
                    <Text style={styles.bulletText}>{practice}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.card}>
                {diseaseData?.prevention && diseaseData.prevention.length > 0 ? (
                  diseaseData.prevention.map((item, idx) => (
                    <View key={item.id || idx} style={styles.bulletRow}>
                      <Text style={styles.bulletDotCheck}>✓</Text>
                      <Text style={styles.bulletText}>{item.prevention}</Text>
                    </View>
                  ))
                ) : (
                  diseaseInfo?.prevention?.map((item: string, idx: number) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={styles.bulletDotCheck}>✓</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* ================= 4. DESCRIPTION & SYMPTOMS ================= */}
        {diseaseData?.disease?.description && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📖 Agronomic Context & Symptoms</Text>
            <Text style={styles.descriptionText}>{diseaseData.disease.description}</Text>

            {diseaseInfo?.symptoms && diseaseInfo.symptoms.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.subSectionTitle}>🔍 Observed Foliage Symptoms:</Text>
                {diseaseInfo.symptoms.map((symptom: string, idx: number) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{symptom}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Differential Possibilities (Top 3) */}
        {topPossibilities.length > 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📊 {Strings.result.otherPossibilities}</Text>
            {topPossibilities.map((item, idx) => {
              const p = parseLabel(item.label);
              const pct = (item.confidence * 100).toFixed(1);
              return (
                <View key={item.index || idx} style={styles.possibilityRow}>
                  <Text style={styles.possibilityRank}>{idx + 1}.</Text>
                  <View style={{ flex: 1, marginHorizontal: 8 }}>
                    <Text style={styles.possibilityName}>
                      {p.emoji} {p.crop} — {p.disease}
                    </Text>
                  </View>
                  <Text style={styles.possibilityPct}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* General Disclaimer Notice */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerIcon}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.disclaimerTitle}>{Strings.result.safetyTitle}</Text>
            <Text style={styles.disclaimerText}>
              {Strings.result.safetyDisclaimer}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PrimaryButton
            title={saved ? Strings.result.alreadySaved : Strings.result.saveResult}
            icon={saved ? '✓' : '💾'}
            variant={saved ? 'secondary' : 'primary'}
            onPress={handleSaveResult}
            loading={saving}
            disabled={saved}
          />

          <PrimaryButton
            title={Strings.result.analyzeAnother}
            icon="📷"
            variant="outline"
            onPress={() => navigation.navigate('Home')}
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
    paddingTop: 18,
    paddingBottom: 40,
  },
  imageCard: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    backgroundColor: '#000000',
    elevation: 3,
  },
  leafImage: {
    width: '100%',
    height: '100%',
  },
  cropBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 2,
  },
  cropEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  healthyBorder: {
    borderLeftWidth: 5,
    borderLeftColor: Colors.healthy,
  },
  diseaseBorder: {
    borderLeftWidth: 5,
    borderLeftColor: Colors.disease,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagHealthy: {
    backgroundColor: Colors.healthyBg,
  },
  statusTagDisease: {
    backgroundColor: Colors.diseaseBg,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextHealthy: {
    color: Colors.healthy,
  },
  statusTextDisease: {
    color: Colors.disease,
  },
  latencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  diseaseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  uncertainBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.warningBg,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  uncertainIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  uncertainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warning,
    marginBottom: 2,
  },
  uncertainText: {
    fontSize: 12,
    color: '#8D4004',
    lineHeight: 18,
  },
  filterSection: {
    marginBottom: 14,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.tint,
    borderRadius: 10,
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  sectionWrapper: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainSectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  treatmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
  },
  treatmentHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  treatmentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  treatmentDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  viralCard: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EF5350',
  },
  viralIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  viralTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#C62828',
    marginBottom: 4,
  },
  viralText: {
    fontSize: 12,
    color: '#B71C1C',
    lineHeight: 18,
  },
  advisoryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFDE7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFF59D',
  },
  advisoryIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  advisoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F57F17',
    marginBottom: 4,
  },
  advisoryText: {
    fontSize: 12,
    color: '#5D4037',
    lineHeight: 18,
  },
  chemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chemBadge: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chemBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#283593',
  },
  activeIngredientText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  safetyBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  safetyNoteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  healthyMessage: {
    fontSize: 14,
    color: Colors.healthy,
    fontWeight: '600',
    lineHeight: 20,
  },
  emptyNote: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  possibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  possibilityRank: {
    width: 20,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  possibilityName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  possibilityPct: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    width: 16,
    fontSize: 18,
    color: Colors.primary,
    lineHeight: 20,
  },
  bulletDotCheck: {
    width: 16,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE57F',
  },
  disclaimerIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B78103',
    marginBottom: 2,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6D4C00',
    lineHeight: 18,
  },
  actions: {
    marginTop: 8,
  },
});
