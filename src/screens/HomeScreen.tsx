import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { StatusBadge } from '../components/StatusBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { tfliteService } from '../services/tfliteService';
import { runDatabaseMigrations } from '../database/migrations';
import { sqliteService } from '../services/sqliteService';

interface Props {
  navigation: any;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [initLoading, setInitLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1. Initialize SQLite Database & seed if needed
        let dbOk = false;
        try {
          dbOk = await runDatabaseMigrations();
        } catch (dbErr) {
          console.error('Database migration error on HomeScreen:', dbErr);
          dbOk = sqliteService.isDatabaseReady();
        }

        // 2. Initialize TFLite Model
        let modelOk = false;
        try {
          modelOk = await tfliteService.initModel();
        } catch (modelErr) {
          console.error('TFLite model init error on HomeScreen:', modelErr);
        }

        if (mounted) {
          setIsDbReady(dbOk);
          setIsModelReady(modelOk);
          setInitLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setIsDbReady(false);
          setIsModelReady(false);
          setInitLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePickGallery = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.9,
        selectionLimit: 1,
      });

      if (response.didCancel) return;

      if (response.errorCode) {
        Alert.alert('Gallery Error', response.errorMessage || Strings.gallery.permissionDenied);
        return;
      }

      const asset = response.assets?.[0];
      if (asset?.uri) {
        navigation.navigate('Analysis', { imageUri: asset.uri });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || Strings.errors.imageProcessFailed);
    }
  };

  const handleScanLeaf = () => {
    navigation.navigate('Camera');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Hero Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appTitle}>🌱 {Strings.common.appName}</Text>
          <TouchableOpacity
            style={styles.diagButton}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Settings"
          >
            <Text style={styles.diagButtonText}>⚙️ Settings</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.appTagline}>{Strings.common.tagline}</Text>
        <StatusBadge
          modelReady={isModelReady}
          dbReady={isDbReady}
          offlineMode={true}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>{Strings.home.heroTitle}</Text>
          <Text style={styles.welcomeSubtitle}>{Strings.home.heroSubtitle}</Text>

          {/* Core Action Buttons */}
          <View style={styles.actionGroup}>
            <PrimaryButton
              title={Strings.home.scanLeaf}
              icon="📷"
              variant="primary"
              onPress={handleScanLeaf}
            />

            <PrimaryButton
              title={Strings.home.chooseGallery}
              icon="🖼️"
              variant="secondary"
              onPress={handlePickGallery}
            />

            <PrimaryButton
              title={Strings.home.browseDiseases}
              icon="🔍"
              variant="outline"
              onPress={() => navigation.navigate('DiseaseDetails')}
            />

            <PrimaryButton
              title={Strings.home.scanHistory}
              icon="📜"
              variant="outline"
              onPress={() => navigation.navigate('History')}
            />
          </View>
        </View>

        {/* Crop Recommendation Card */}
        <View style={styles.cropAnalysisCard}>
          <View style={styles.analysisBadgeRow}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>🌾 CROP RECOMMENDATION</Text>
            </View>
            <Text style={styles.offlineBadgeText}>100% Offline • TNAU / ICAR</Text>
          </View>

          {/* Recommend Crops by Soil */}
          <TouchableOpacity
            style={styles.analysisCardContent}
            onPress={() => navigation.navigate('CropRecommendationInput')}
            activeOpacity={0.7}
          >
            <Text style={styles.analysisCardEmoji}>🧪</Text>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={styles.analysisCardTitle}>Crop Recommendation by Soil</Text>
              <Text style={styles.analysisCardDesc}>
                Enter your soil (N-P-K, pH) & climate to get ranked crop suggestions.
              </Text>
            </View>
            <Text style={styles.analysisArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Farmer Quick Tips */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 {Strings.home.quickTipsTitle}</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>1.</Text>
            <Text style={styles.tipText}>{Strings.home.tip1}</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>2.</Text>
            <Text style={styles.tipText}>{Strings.home.tip2}</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>3.</Text>
            <Text style={styles.tipText}>{Strings.home.tip3}</Text>
          </View>
        </View>

        {/* Supported Crops Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌿 Supported Crops & 16 Conditions</Text>
          <View style={styles.cropGrid}>
            <View style={styles.cropBadge}>
              <Text style={styles.cropEmoji}>🍅</Text>
              <Text style={styles.cropName}>Tomato</Text>
              <Text style={styles.cropClasses}>8 conditions</Text>
            </View>
            <View style={styles.cropBadge}>
              <Text style={styles.cropEmoji}>🌽</Text>
              <Text style={styles.cropName}>Corn (Maize)</Text>
              <Text style={styles.cropClasses}>4 conditions</Text>
            </View>
            <View style={styles.cropBadge}>
              <Text style={styles.cropEmoji}>🌱</Text>
              <Text style={styles.cropName}>Soybean</Text>
              <Text style={styles.cropClasses}>3 conditions</Text>
            </View>
            <View style={styles.cropBadge}>
              <Text style={styles.cropEmoji}>🥬</Text>
              <Text style={styles.cropName}>Cabbage</Text>
              <Text style={styles.cropClasses}>2 conditions</Text>
            </View>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>{Strings.common.privacyNotice}</Text>
        </View>

        {/* About App Footer Link */}
        <TouchableOpacity
          style={styles.aboutLink}
          onPress={() => navigation.navigate('About')}
        >
          <Text style={styles.aboutLinkText}>ℹ️ {Strings.home.aboutApp}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 20 : 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  appTagline: {
    fontSize: 14,
    color: '#D0E8D4',
    marginTop: 4,
    marginBottom: 8,
  },
  diagButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  diagButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionGroup: {
    marginTop: 4,
  },
  cropAnalysisCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    elevation: 2,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  analysisBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  newBadge: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  offlineBadgeText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '700',
  },
  analysisCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisCardEmoji: {
    fontSize: 32,
  },
  analysisCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14532D',
    marginBottom: 2,
  },
  analysisCardDesc: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
  analysisArrow: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#BBF7D0',
    marginVertical: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipNumber: {
    width: 20,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  cropBadge: {
    width: '48%',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.tintBorder,
  },
  cropEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cropClasses: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DFE8DF',
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  aboutLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  aboutLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
