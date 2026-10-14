import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  CropRequirement,
  UserCropInput,
  CropAnalysisResult,
  FactorResult,
} from '../types/cropAnalysis';
import { cropAnalysisService } from '../services/cropAnalysisService';
import { CROP_ANALYSIS_DISCLAIMERS } from '../constants/cropAnalysisConfig';

interface Props {
  route: any;
  navigation: any;
}

export const CropAnalysisResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { crop, userInput, result } = route.params as {
    crop: CropRequirement;
    userInput: UserCropInput;
    result: CropAnalysisResult;
  };

  const [saved, setSaved] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'summary' | 'factors'>('summary');

  const statusColor =
    result.status === 'Suitable'
      ? '#16A34A'
      : result.status === 'Moderately Suitable'
      ? '#D97706'
      : '#DC2626';

  const statusBg =
    result.status === 'Suitable'
      ? '#DCFCE7'
      : result.status === 'Moderately Suitable'
      ? '#FEF3C7'
      : '#FEE2E2';

  const statusEmoji =
    result.status === 'Suitable' ? '🟢' : result.status === 'Moderately Suitable' ? '🟡' : '🔴';

  const handleSave = async () => {
    if (saved) return;
    try {
      setSaving(true);
      await cropAnalysisService.saveAnalysis(
        result.crop,
        result.overallScore,
        result.status,
        userInput,
        result
      );
      setSaved(true);
      Alert.alert('Saved', `${result.crop} suitability analysis saved to local history.`);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save analysis: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSourceUrl = () => {
    if (result.sourceInfo?.sourceUrl) {
      Linking.openURL(result.sourceInfo.sourceUrl).catch(() => {
        Alert.alert('Link Error', 'Unable to open link on this device.');
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Score Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSubTitle}>🌾 {result.crop} Suitability Analysis</Text>

          <View style={styles.scoreRow}>
            <View style={[styles.scoreDial, { borderColor: statusColor }]}>
              <Text style={[styles.scoreNumber, { color: statusColor }]}>{result.overallScore}</Text>
              <Text style={styles.scoreMax}>/ 100</Text>
            </View>

            <View style={styles.statusInfo}>
              <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {statusEmoji} {result.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.scoreDisclaimer}>
                {result.overallScore >= 80
                  ? 'Favorable physiological & soil alignment.'
                  : result.overallScore >= 60
                  ? 'Moderate suitability; some management interventions recommended.'
                  : 'Key limiting constraints detected for this crop.'}
              </Text>
            </View>
          </View>
        </View>

        {/* View Toggle Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeView === 'summary' && styles.tabActive]}
            onPress={() => setActiveView('summary')}
          >
            <Text style={[styles.tabText, activeView === 'summary' && styles.tabTextActive]}>
              📋 Summary & Guidance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeView === 'factors' && styles.tabActive]}
            onPress={() => setActiveView('factors')}
          >
            <Text style={[styles.tabText, activeView === 'factors' && styles.tabTextActive]}>
              🔍 All Parameters ({result.factors.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeView === 'summary' ? (
          <View>
            {/* 1. Strengths / Suitable Factors */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionHeading}>✅ Favorable Factors & Strengths</Text>
                <View style={styles.countBadgeGreen}>
                  <Text style={styles.countBadgeGreenText}>{result.strengths.length}</Text>
                </View>
              </View>

              {result.strengths.length > 0 ? (
                result.strengths.map((s, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.bulletCheck}>✓</Text>
                    <Text style={styles.bulletText}>{s.replace(/^[✓]\s*/, '')}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyNote}>No factors were within the optimal target range.</Text>
              )}
            </View>

            {/* 2. Limitations / Vulnerabilities */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionHeading}>⚠️ Limiting Factors & Constraints</Text>
                <View style={styles.countBadgeAmber}>
                  <Text style={styles.countBadgeAmberText}>{result.limitations.length}</Text>
                </View>
              </View>

              {result.limitations.length > 0 ? (
                result.limitations.map((l, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.bulletWarn}>⚠</Text>
                    <Text style={styles.bulletText}>{l.replace(/^[⚠❌]\s*/, '')}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyNote}>No major limiting constraints detected.</Text>
              )}
            </View>

            {/* 3. Missing Factors */}
            {result.missingFactors.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.sectionHeading}>ℹ️ Missing Information</Text>
                  <View style={styles.countBadgeGray}>
                    <Text style={styles.countBadgeGrayText}>{result.missingFactors.length}</Text>
                  </View>
                </View>
                <Text style={styles.missingNotice}>
                  The following parameters were not provided. The overall score was normalized across the available factors without penalty:
                </Text>
                <View style={styles.tagsWrap}>
                  {result.missingFactors.map((m, idx) => (
                    <View key={idx} style={styles.tagItem}>
                      <Text style={styles.tagText}>• {m}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 4. Objective Agronomic Guidance */}
            <View style={styles.guidanceCard}>
              <Text style={styles.guidanceHeader}>💡 Objective Agronomic Guidance</Text>
              {result.guidance.map((g, idx) => (
                <View key={idx} style={styles.guidanceRow}>
                  <Text style={styles.guidanceDot}>🔹</Text>
                  <Text style={styles.guidanceText}>{g}</Text>
                </View>
              ))}
            </View>

            {/* 5. Source Attribution Card */}
            <View style={styles.sourceCard}>
              <View style={styles.sourceHeader}>
                <Text style={styles.sourceTitle}>📚 Knowledge Base Source</Text>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedTagText}>TNAU / ICAR</Text>
                </View>
              </View>
              <Text style={styles.sourceMeta}>
                <Text style={{ fontWeight: '700' }}>Authority:</Text> {result.sourceInfo?.source || 'TNAU'}
              </Text>
              {result.sourceInfo?.sourceNote ? (
                <Text style={styles.sourceNoteText}>
                  <Text style={{ fontWeight: '700' }}>Reference:</Text> {result.sourceInfo.sourceNote}
                </Text>
              ) : null}
              {result.sourceInfo?.sourceUrl ? (
                <TouchableOpacity style={styles.sourceLink} onPress={handleOpenSourceUrl}>
                  <Text style={styles.sourceLinkText}>🔗 View Published Guidelines →</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : (
          /* ================= VIEW: FULL PARAMETERS BREAKDOWN ================= */
          <View>
            {result.factors.map((f: FactorResult, idx: number) => {
              const fColor =
                f.status === 'Suitable'
                  ? '#16A34A'
                  : f.status === 'Moderately Suitable'
                  ? '#D97706'
                  : f.status === 'Not Suitable'
                  ? '#DC2626'
                  : '#64748B';

              return (
                <View key={idx} style={styles.factorCard}>
                  <View style={styles.factorHeaderRow}>
                    <Text style={styles.factorName}>{f.factor}</Text>
                    <View style={[styles.statusTag, { backgroundColor: fColor + '20' }]}>
                      <Text style={[styles.statusTagText, { color: fColor }]}>{f.status}</Text>
                    </View>
                  </View>

                  <View style={styles.factorMetaRow}>
                    <Text style={styles.factorValueText}>
                      Your value: <Text style={{ fontWeight: '700' }}>{f.userValue ?? 'Not provided'}</Text>
                    </Text>
                    <Text style={styles.factorPointsText}>
                      Points: {f.points} / {f.maxPoints}
                    </Text>
                  </View>

                  <Text style={styles.factorReqText}>Target range: {f.requirement || 'Not specified'}</Text>
                  <Text style={styles.factorExpText}>{f.explanation}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Disclaimer Card */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerIcon}>📋</Text>
          <Text style={styles.disclaimerText}>{CROP_ANALYSIS_DISCLAIMERS.SUITABILITY_NOTICE}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PrimaryButton
            title={saved ? 'Analysis Saved ✓' : 'Save Analysis to History'}
            icon={saved ? '✓' : '💾'}
            variant={saved ? 'secondary' : 'primary'}
            onPress={handleSave}
            loading={saving}
            disabled={saved}
          />

          <PrimaryButton
            title="Analyze Another Crop"
            icon="🌾"
            variant="outline"
            onPress={() => navigation.navigate('CropAnalysis')}
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
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  heroSubTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreDial: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: '#F8FAFC',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '900',
  },
  scoreMax: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  statusInfo: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scoreDisclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  countBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeGreenText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  countBadgeAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeAmberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  countBadgeGray: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeGrayText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletCheck: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '800',
    marginRight: 8,
    marginTop: 1,
  },
  bulletWarn: {
    fontSize: 14,
    color: '#D97706',
    marginRight: 8,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  emptyNote: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  missingNotice: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagItem: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  guidanceCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  guidanceHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 8,
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  guidanceDot: {
    fontSize: 12,
    marginRight: 8,
    marginTop: 3,
  },
  guidanceText: {
    flex: 1,
    fontSize: 13,
    color: '#14532D',
    lineHeight: 18,
  },
  sourceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  verifiedTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  sourceMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  sourceNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  sourceLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  sourceLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  factorCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  factorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  factorName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  factorMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  factorValueText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  factorPointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  factorReqText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  factorExpText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  disclaimerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  actions: {
    marginTop: 6,
  },
});
