import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { AppConfig } from '../constants/config';
import { historyService } from '../services/historyService';
import { diseaseService } from '../services/diseaseService';
import { sqliteService } from '../services/sqliteService';

interface Props {
  navigation: any;
}

const THRESHOLD_OPTIONS = [0.5, 0.6, 0.7, 0.8, 0.85];

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [threshold, setThreshold] = useState<number>(AppConfig.confidence.threshold);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [totalDiseases, setTotalDiseases] = useState<number>(16);
  const [isDbReady, setIsDbReady] = useState<boolean>(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const scans = await historyService.getScans();
      setTotalScans(scans.length);
      const count = await diseaseService.getDiseaseCount();
      if (count > 0) setTotalDiseases(count);
      setIsDbReady(sqliteService.isDatabaseReady());
    } catch (e) {
      console.warn('Error loading stats in SettingsScreen:', e);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      Strings.history.clearConfirmTitle,
      Strings.history.clearConfirmMessage,
      [
        { text: Strings.common.cancel, style: 'cancel' },
        {
          text: Strings.common.delete,
          style: 'destructive',
          onPress: async () => {
            const success = await historyService.clearAllHistory();
            if (success) {
              setTotalScans(0);
              Alert.alert('Success', 'Scan history cleared from SQLite database.');
            } else {
              Alert.alert('Error', 'Failed to clear scan history.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header summary */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>⚙️ {Strings.settings.title}</Text>
          <Text style={styles.headerSubtitle}>
            Configure offline diagnosis parameters and manage local SQLite storage.
          </Text>
        </View>

        {/* Section 1: AI Confidence Threshold */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🎯 {Strings.settings.sectionPreferences}</Text>
          <Text style={styles.settingLabel}>{Strings.settings.thresholdTitle}</Text>
          <Text style={styles.settingSubtitle}>
            {Strings.settings.thresholdSubtitle.replace('{val}', `${Math.round(threshold * 100)}`)}
          </Text>

          <View style={styles.thresholdRow}>
            {THRESHOLD_OPTIONS.map((val) => {
              const isSelected = Math.abs(val - threshold) < 0.01;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.thresholdBtn, isSelected && styles.thresholdBtnActive]}
                  onPress={() => setThreshold(val)}
                >
                  <Text style={[styles.thresholdBtnText, isSelected && styles.thresholdBtnTextActive]}>
                    {Math.round(val * 100)}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Language */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🌐 {Strings.settings.languageTitle}</Text>
          <View style={styles.langRow}>
            <View style={styles.langActiveBadge}>
              <Text style={styles.langActiveText}>✓ English (Active)</Text>
            </View>
            <View style={styles.langComingBadge}>
              <Text style={styles.langComingText}>🇮🇳 தமிழ் (Tamil ready)</Text>
            </View>
          </View>
          <Text style={styles.langNote}>
            Tamil translations for treatment protocols and farmer strings are pre-configured in local resources.
          </Text>
        </View>

        {/* Section 3: SQLite Storage */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💾 {Strings.settings.sectionStorage}</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Database File:</Text>
            <Text style={styles.statValue}>cropcare.db (SQLite 3)</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Database Status:</Text>
            <Text style={[styles.statValue, { color: isDbReady ? Colors.healthy : Colors.disease }]}>
              {isDbReady ? '● Operational (Ready)' : '● Not Ready'}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Seeded Diseases:</Text>
            <Text style={styles.statValue}>{totalDiseases} Classes (TNAU/ICAR)</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Saved Scans:</Text>
            <Text style={styles.statValue}>{totalScans} entries</Text>
          </View>

          <TouchableOpacity
            style={[styles.clearBtn, totalScans === 0 && styles.clearBtnDisabled]}
            onPress={handleClearHistory}
            disabled={totalScans === 0}
          >
            <Text style={styles.clearBtnText}>🗑️ {Strings.settings.clearHistoryBtn}</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4: Diagnostics & Model Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🔬 {Strings.settings.sectionAbout}</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>TFLite Model:</Text>
            <Text style={styles.statValue}>plant_disease.tflite</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Architecture:</Text>
            <Text style={styles.statValue}>MobileNetV2 (300×300 RGB UINT8)</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Engine:</Text>
            <Text style={styles.statValue}>Native Google TFLite 2.14.0 (4 Threads)</Text>
          </View>

          <TouchableOpacity
            style={styles.navLinkBtn}
            onPress={() => navigation.navigate('Diagnostics')}
          >
            <Text style={styles.navLinkText}>⚡ {Strings.settings.viewDiagnostics} →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navLinkBtn}
            onPress={() => navigation.navigate('About')}
          >
            <Text style={styles.navLinkText}>ℹ️ {Strings.settings.aboutApp} →</Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#D0E8D4',
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 14,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  thresholdBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  thresholdBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  thresholdBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  thresholdBtnTextActive: {
    color: '#FFFFFF',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  langActiveBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  langActiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  langComingBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  langComingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  langNote: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  clearBtn: {
    marginTop: 16,
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  clearBtnDisabled: {
    opacity: 0.5,
  },
  clearBtnText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '700',
  },
  navLinkBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
