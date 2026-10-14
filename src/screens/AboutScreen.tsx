import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';

export const AboutScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* App Hero */}
        <View style={styles.hero}>
          <Text style={styles.logo}>🌱</Text>
          <Text style={styles.title}>{Strings.common.appName}</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>{Strings.common.tagline}</Text>
        </View>

        {/* Mission Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌾 {Strings.about.missionTitle}</Text>
          <Text style={styles.cardText}>{Strings.about.missionText}</Text>
        </View>

        {/* Model Attribution Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔬 {Strings.about.modelSourceTitle}</Text>
          <Text style={styles.cardText}>{Strings.about.modelSourceText}</Text>
          <View style={styles.sourceBox}>
            <Text style={styles.sourceLabel}>Original Model Repository:</Text>
            <Text style={styles.sourceUrl}>github.com/mariarodr1136/LeafMedic</Text>
          </View>
        </View>

        {/* Privacy Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔒 {Strings.about.privacyTitle}</Text>
          <Text style={styles.cardText}>{Strings.about.privacyText}</Text>
        </View>

        {/* Key Features List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ Key Technical Highlights</Text>
          <Text style={styles.bullet}>• On-Device TFLite Quantized MobileNetV2 (~11 MB)</Text>
          <Text style={styles.bullet}>• 100% Offline Inference (Zero cloud API dependency)</Text>
          <Text style={styles.bullet}>• Strict 300×300 RGB UINT8 Preprocessing Pipeline</Text>
          <Text style={styles.bullet}>• 16 Crop Disease & Health Classes</Text>
          <Text style={styles.bullet}>• Local Scan History with SQLite/AsyncStorage</Text>
          <Text style={styles.bullet}>• Local Symptoms & Cultural Prevention Database</Text>
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
    paddingBottom: 36,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logo: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  version: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  tagline: {
    fontSize: 15,
    color: Colors.primaryDark,
    marginTop: 6,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bullet: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  sourceBox: {
    backgroundColor: '#F1F8F2',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.tintBorder,
  },
  sourceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sourceUrl: {
    fontSize: 13,
    color: Colors.primaryDark,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginTop: 2,
  },
});
