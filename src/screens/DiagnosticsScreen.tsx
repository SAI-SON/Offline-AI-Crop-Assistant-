import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { PrimaryButton } from '../components/PrimaryButton';
import { tfliteService } from '../services/tfliteService';
import { sqliteService } from '../services/sqliteService';
import { diseaseService } from '../services/diseaseService';
import { ModelDiagnostics } from '../types';

export const DiagnosticsScreen: React.FC = () => {
  const [diag, setDiag] = useState<ModelDiagnostics | null>(null);
  const [dbReady, setDbReady] = useState<boolean>(true);
  const [dbCount, setDbCount] = useState<number>(16);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const data = await tfliteService.getDiagnostics();
      setDiag(data);

      const isReady = sqliteService.isDatabaseReady();
      setDbReady(isReady);

      const count = await diseaseService.getDiseaseCount();
      if (count > 0) setDbCount(count);
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ {Strings.diagnostics.title}</Text>
          <Text style={styles.subtitle}>{Strings.diagnostics.subtitle}</Text>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Reading TFLite tensor metadata...</Text>
          </View>
        ) : diag ? (
          <>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusLabel}>TFLite Runtime Status:</Text>
                <Text style={styles.statusValue}>{diag.status}</Text>
              </View>
            </View>

            {/* Model Architecture Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Model Specifications</Text>

              <View style={styles.row}>
                <Text style={styles.label}>{Strings.diagnostics.modelName}:</Text>
                <Text style={styles.valueMono}>{diag.modelFile}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>{Strings.diagnostics.modelSize}:</Text>
                <Text style={styles.valueBold}>{diag.modelSizeFormatted}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>{Strings.diagnostics.runtime}:</Text>
                <Text style={styles.value}>{diag.runtime}</Text>
              </View>
            </View>

            {/* Tensor Metadata Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Tensor Contract</Text>

              <View style={styles.row}>
                <Text style={styles.label}>{Strings.diagnostics.inputShape}:</Text>
                <Text style={styles.valueMono}>
                  [{diag.inputShape?.join(', ') || '1, 300, 300, 3'}]
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>{Strings.diagnostics.inputType}:</Text>
                <Text style={styles.valueTag}>UINT8 (0–255, RGB)</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>{Strings.diagnostics.outputShape}:</Text>
                <Text style={styles.valueMono}>
                  [{diag.outputShape?.join(', ') || '1, 16'}]
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>{Strings.diagnostics.outputType}:</Text>
                <Text style={styles.valueTag}>UINT8 (Quantized)</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Supported Classes:</Text>
                <Text style={styles.valueBold}>{diag.labelsCount} classes</Text>
              </View>
            </View>

            {/* Quantization Contract Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>{Strings.diagnostics.quantizationDetails}</Text>
              <Text style={styles.formulaText}>
                real_value = (quantized_value - zero_point) × scale
              </Text>
              <View style={styles.row}>
                <Text style={styles.label}>Output Scale:</Text>
                <Text style={styles.valueMono}>{diag.outputScale.toFixed(8)} (1/256)</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Output Zero Point:</Text>
                <Text style={styles.valueMono}>{diag.outputZeroPoint}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Normalization:</Text>
                <Text style={styles.valueTag}>NONE (raw UINT8 pixels)</Text>
              </View>
            </View>

            {/* Local SQLite Database Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Local SQLite Database</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Database File:</Text>
                <Text style={styles.valueMono}>cropcare.db</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Database Status:</Text>
                <Text style={styles.valueTag}>
                  {dbReady ? 'READY (Initialized)' : 'INITIALIZING...'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Seeded Diseases:</Text>
                <Text style={styles.valueBold}>{dbCount} classes</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Guidance Source:</Text>
                <Text style={styles.value}>TNAU & ICAR verified</Text>
              </View>
            </View>

            {/* Refresh Button */}
            <PrimaryButton
              title="Refresh Diagnostics"
              icon="🔄"
              variant="outline"
              onPress={loadDiagnostics}
              style={{ marginTop: 8 }}
            />
          </>
        ) : (
          <Text style={styles.errorText}>Unable to load model diagnostics.</Text>
        )}
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
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B5E20',
    marginLeft: 6,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
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
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  valueBold: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  valueMono: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  valueTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0277BD',
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  formulaText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.disease,
    textAlign: 'center',
    marginTop: 20,
  },
});
