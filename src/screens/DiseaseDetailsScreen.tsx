import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { diseaseService } from '../services/diseaseService';
import { parseLabel } from '../utils/labelParser';
import { DiseaseRecord, FullDiseaseData } from '../types';

interface Props {
  navigation: any;
  route?: any;
}

export const DiseaseDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const selectedLabel = route?.params?.label;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [diseases, setDiseases] = useState<DiseaseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDisease, setActiveDisease] = useState<FullDiseaseData | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  useEffect(() => {
    loadDiseases();
    if (selectedLabel) {
      loadSpecificDisease(selectedLabel);
    }
  }, [selectedLabel]);

  const loadDiseases = async (query: string = '') => {
    try {
      setLoading(true);
      const list = query.trim()
        ? await diseaseService.searchDiseases(query)
        : await diseaseService.getAllDiseases();
      setDiseases(list);
    } catch (err) {
      console.error('Failed to load diseases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    loadDiseases(text);
  };

  const loadSpecificDisease = async (label: string) => {
    try {
      setDetailLoading(true);
      const data = await diseaseService.getDiseaseByLabel(label);
      setActiveDisease(data);
    } catch (err) {
      console.error('Failed to load disease details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const renderDiseaseItem = ({ item }: { item: DiseaseRecord }) => {
    const parsed = parseLabel(item.label);
    const isSelected = activeDisease?.disease.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.itemCardSelected]}
        onPress={() => loadSpecificDisease(item.label)}
        activeOpacity={0.7}
      >
        <Text style={styles.itemEmoji}>{parsed.emoji}</Text>
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <View style={styles.row}>
            <Text style={styles.cropText}>{item.crop}</Text>
            {item.is_healthy === 1 && (
              <View style={styles.healthyBadge}>
                <Text style={styles.healthyText}>Healthy</Text>
              </View>
            )}
          </View>
          <Text style={styles.diseaseText}>{item.disease_name}</Text>
        </View>
        <Text style={styles.arrowIcon}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={Strings.diseaseDetails.searchPlaceholder}
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selected Disease Detail Modal / Card */}
        {detailLoading && (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.smallText}>Loading treatments from SQLite...</Text>
          </View>
        )}

        {activeDisease && !detailLoading && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailCrop}>
                  {parseLabel(activeDisease.disease.label).emoji} {activeDisease.disease.crop}
                </Text>
                <Text style={styles.detailTitle}>{activeDisease.disease.disease_name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveDisease(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.detailDesc}>{activeDisease.disease.description}</Text>

            {/* Quick Stats */}
            <View style={styles.countsRow}>
              <Text style={styles.countTag}>
                🌿 {activeDisease.organicTreatments.length} Organic Options
              </Text>
              <Text style={styles.countTag}>
                🧪 {activeDisease.chemicalTreatments.length} Chemical Options
              </Text>
              <Text style={styles.countTag}>
                🛡 {activeDisease.prevention.length} Prevention Practices
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewTreatmentBtn}
              onPress={() => {
                navigation.navigate('Result', {
                  imageUri: '',
                  inferenceResult: {
                    topPrediction: {
                      index: 0,
                      label: activeDisease.disease.label,
                      crop: activeDisease.disease.crop,
                      disease: activeDisease.disease.disease_name,
                      confidence: 1.0,
                      rawUint8: 255,
                    },
                    predictions: [],
                    rawValues: [],
                    inferenceMs: 0,
                    prepMs: 0,
                    quality: { isAcceptable: true },
                  },
                  fullDiseaseData: activeDisease,
                });
              }}
            >
              <Text style={styles.viewTreatmentBtnText}>
                View Full Treatment Protocol (Organic & Chemical) →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Disease List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.smallText}>Reading cropcare.db...</Text>
          </View>
        ) : diseases.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyIcon}>🌾</Text>
            <Text style={styles.emptyText}>{Strings.diseaseDetails.noResults}</Text>
          </View>
        ) : (
          <FlatList
            data={diseases}
            keyExtractor={item => String(item.id)}
            renderItem={renderDiseaseItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: Colors.textMuted,
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
  },
  itemCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F1F8F2',
  },
  itemEmoji: {
    fontSize: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
  },
  healthyBadge: {
    backgroundColor: Colors.healthyBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  healthyText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.healthy,
  },
  diseaseText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 22,
    color: Colors.textMuted,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  smallText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    elevation: 3,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  detailCrop: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  detailDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  countsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  countTag: {
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: Colors.surfaceAlt,
    color: Colors.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.tintBorder,
  },
  viewTreatmentBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewTreatmentBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
