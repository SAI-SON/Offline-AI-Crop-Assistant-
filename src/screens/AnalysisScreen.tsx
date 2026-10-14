import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { PrimaryButton } from '../components/PrimaryButton';
import { tfliteService } from '../services/tfliteService';
import { diseaseService } from '../services/diseaseService';
import { evaluateImageQuality, QualityValidationResult } from '../utils/imageQuality';
import { InferenceResult, FullDiseaseData } from '../types';

interface Props {
  route: any;
  navigation: any;
}

export const AnalysisScreen: React.FC<Props> = ({ route, navigation }) => {
  const { imageUri } = route.params || {};

  const [stepText, setStepText] = useState<string>(Strings.analysis.stagePrep);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Quality Warning Modal state
  const [qualityModalVisible, setQualityModalVisible] = useState<boolean>(false);
  const [qualityValidation, setQualityValidation] = useState<QualityValidationResult | null>(null);
  const [pendingResult, setPendingResult] = useState<InferenceResult | null>(null);
  const [pendingDiseaseData, setPendingDiseaseData] = useState<FullDiseaseData | null>(null);

  useEffect(() => {
    runAnalysis();
  }, [imageUri]);

  const runAnalysis = async () => {
    if (!imageUri) {
      setError('No image URI was provided.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStepText(Strings.analysis.stagePrep);

      // Stage 1: Inference
      setTimeout(() => {
        setStepText(Strings.analysis.stageInfer);
      }, 300);

      const result = await tfliteService.predict(imageUri);

      // Stage 2: SQLite Query
      setStepText(Strings.analysis.stageDb);
      let fullDiseaseData: FullDiseaseData | null = null;
      try {
        fullDiseaseData = await diseaseService.getDiseaseByLabel(result.topPrediction.label);
      } catch (dbErr) {
        console.warn('SQLite disease query error:', dbErr);
      }

      setStepText(Strings.analysis.stageComplete);

      // Evaluate quality
      const qualityCheck = evaluateImageQuality(result.quality);
      if (!qualityCheck.isAcceptable) {
        setQualityValidation(qualityCheck);
        setPendingResult(result);
        setPendingDiseaseData(fullDiseaseData);
        setQualityModalVisible(true);
        setLoading(false);
        return;
      }

      // Proceed directly to results
      navigateToResult(result, fullDiseaseData);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || Strings.analysis.errorMessage);
      setLoading(false);
    }
  };

  const navigateToResult = (result: InferenceResult, fullDiseaseData: FullDiseaseData | null) => {
    const topLabel = result.topPrediction.label;
    const diseaseInfo = tfliteService.getDiseaseInfo(topLabel);

    navigation.replace('Result', {
      imageUri,
      inferenceResult: result,
      diseaseInfo,
      fullDiseaseData,
    });
  };

  const handleProceedAnyway = () => {
    setQualityModalVisible(false);
    if (pendingResult) {
      navigateToResult(pendingResult, pendingDiseaseData);
    }
  };

  const handleRetake = () => {
    setQualityModalVisible(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Leaf Image View */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.leafImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholder} />
          )}

          {/* Scanning Animation Overlay */}
          <View style={styles.scanningOverlay}>
            <View style={styles.scanLine} />
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 16 }} />
              <Text style={styles.statusTitle}>{Strings.analysis.title}</Text>
              <Text style={styles.statusSubtitle}>{stepText}</Text>
              <Text style={styles.offlineNotice}>⚡ Powered by on-device MobileNetV2</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>{Strings.analysis.errorTitle}</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <PrimaryButton
                title={Strings.common.retry}
                onPress={runAnalysis}
                style={{ width: '100%', marginTop: 12 }}
              />
              <PrimaryButton
                title={Strings.common.back}
                variant="outline"
                onPress={() => navigation.goBack()}
                style={{ width: '100%', marginTop: 8 }}
              />
            </View>
          )}
        </View>
      </View>

      {/* Image Quality Warning Modal */}
      <Modal
        visible={qualityModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleRetake}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>{Strings.analysis.qualityWarningTitle}</Text>
            <Text style={styles.modalText}>{Strings.analysis.qualityWarningMessage}</Text>

            {qualityValidation?.warnings.map((w, idx) => (
              <Text key={idx} style={styles.warningBullet}>• {w}</Text>
            ))}

            <View style={styles.modalButtons}>
              <PrimaryButton
                title={Strings.analysis.retake}
                variant="outline"
                onPress={handleRetake}
                style={{ marginBottom: 8 }}
              />
              <PrimaryButton
                title={Strings.analysis.proceedAnyway}
                variant="primary"
                onPress={handleProceedAnyway}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0E1A11',
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#000000',
  },
  leafImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#1E2D20',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '85%',
    height: 3,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 32,
    elevation: 8,
  },
  loadingBox: {
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  offlineNotice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  errorBox: {
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.disease,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    elevation: 10,
  },
  modalIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  warningBullet: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  modalButtons: {
    width: '100%',
    marginTop: 18,
  },
});
