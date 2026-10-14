import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Colors } from '../constants/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  CropRecommendationItem,
  UserCropInput,
} from '../types/cropAnalysis';

interface Props {
  route: any;
  navigation: any;
}

const CROP_EMOJIS: Record<string, string> = {
  Rice: '🌾',
  Maize: '🌽',
  Groundnut: '🥜',
  Tomato: '🍅',
  Soybean: '🌱',
  Cotton: '🧶',
  Sugarcane: '🎋',
  Blackgram: '🥣',
  Greengram: '🥗',
  Chickpea: '🧆',
};

type FilterCategory = 'all' | 'suitable' | 'moderate' | 'low';

export const CropRecommendationResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userInput, recommendations } = route.params as {
    userInput: UserCropInput;
    recommendations: CropRecommendationItem[];
  };

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const suitableCrops = recommendations.filter(r => r.score >= 80);
  const moderateCrops = recommendations.filter(r => r.score >= 60 && r.score < 80);
  const lowCrops = recommendations.filter(r => r.score < 60);

  const displayedCrops =
    activeFilter === 'suitable'
      ? suitableCrops
      : activeFilter === 'moderate'
      ? moderateCrops
      : activeFilter === 'low'
      ? lowCrops
      : recommendations;

  const handleOpenCropReport = (item: CropRecommendationItem) => {
    navigation.navigate('CropAnalysisResult', {
      crop: item.crop,
      userInput,
      result: item.analysis,
    });
  };

  const renderRecommendationCard = ({
    item,
    index,
  }: {
    item: CropRecommendationItem;
    index: number;
  }) => {
    const emoji = CROP_EMOJIS[item.crop.crop_name] || '🌿';
    const rank = index + 1;

    const statusColor =
      item.score >= 80 ? '#16A34A' : item.score >= 60 ? '#D97706' : '#DC2626';

    const statusBg =
      item.score >= 80 ? '#DCFCE7' : item.score >= 60 ? '#FEF3C7' : '#FEE2E2';

    const rankBadgeBg =
      rank === 1 ? '#FEF08A' : rank === 2 ? '#E2E8F0' : rank === 3 ? '#FED7AA' : '#F1F5F9';

    const topStrength = item.analysis.strengths[0];
    const topLimitation = item.analysis.limitations[0];

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: statusColor }]}
        onPress={() => handleOpenCropReport(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.rankBadge, { backgroundColor: rankBadgeBg }]}>
            <Text style={styles.rankText}>#{rank}</Text>
          </View>

          <Text style={styles.cropEmoji}>{emoji}</Text>

          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>{item.crop.crop_name}</Text>
            {item.crop.season ? (
              <Text style={styles.seasonText}>🗓 {item.crop.season}</Text>
            ) : null}
          </View>

          <View style={[styles.scoreDial, { borderColor: statusColor, backgroundColor: statusBg }]}>
            <Text style={[styles.scoreNumber, { color: statusColor }]}>{item.score}</Text>
            <Text style={styles.scoreScale}>/100</Text>
          </View>
        </View>

        {/* Highlights */}
        <View style={styles.highlightsBox}>
          {topStrength ? (
            <View style={styles.highlightRow}>
              <Text style={styles.iconGreen}>✓</Text>
              <Text style={styles.strengthText} numberOfLines={1}>
                {topStrength.replace(/^[✓]\s*/, '')}
              </Text>
            </View>
          ) : null}

          {topLimitation ? (
            <View style={styles.highlightRow}>
              <Text style={styles.iconAmber}>⚠</Text>
              <Text style={styles.limitationText} numberOfLines={1}>
                {topLimitation.replace(/^[⚠❌]\s*/, '')}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.countsRow}>
            <Text style={styles.countsText}>
              🌿 {item.strengthsCount} strengths • ⚠️ {item.limitationsCount} limitations
            </Text>
          </View>
          <Text style={styles.detailsLink}>View Report →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        {/* Header Summary Banner */}
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryTitle}>🌾 Ranked Crop Recommendations</Text>
          <Text style={styles.summarySubtitle}>
            Evaluated against TNAU / ICAR reference guides. Tapping any crop opens its full suitability report.
          </Text>

          {/* Quick Stats Pill */}
          <View style={styles.pillsRow}>
            <View style={styles.pillGreen}>
              <Text style={styles.pillGreenText}>🟢 {suitableCrops.length} Best Matches</Text>
            </View>
            <View style={styles.pillAmber}>
              <Text style={styles.pillAmberText}>🟡 {moderateCrops.length} Moderate</Text>
            </View>
            <View style={styles.pillRed}>
              <Text style={styles.pillRedText}>🔴 {lowCrops.length} Low</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              All ({recommendations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'suitable' && styles.filterChipActive]}
            onPress={() => setActiveFilter('suitable')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'suitable' && styles.filterChipTextActive]}>
              🟢 Best ({suitableCrops.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'moderate' && styles.filterChipActive]}
            onPress={() => setActiveFilter('moderate')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'moderate' && styles.filterChipTextActive]}>
              🟡 Moderate ({moderateCrops.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'low' && styles.filterChipActive]}
            onPress={() => setActiveFilter('low')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'low' && styles.filterChipTextActive]}>
              🔴 Low ({lowCrops.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recommendations List */}
        <FlatList
          data={displayedCrops}
          keyExtractor={item => String(item.crop.id)}
          renderItem={renderRecommendationCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={styles.footerActions}>
              <PrimaryButton
                title="Test Other Soil Conditions"
                icon="🔄"
                variant="outline"
                onPress={() => navigation.goBack()}
              />
            </View>
          }
        />
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
  summaryBanner: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#D0E8D4',
    marginTop: 4,
    lineHeight: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  pillGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillGreenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  pillAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillAmberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  pillRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillRedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: Colors.primaryDark,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cropEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  seasonText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scoreDial: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '900',
  },
  scoreScale: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '700',
    marginTop: -2,
  },
  highlightsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconGreen: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '800',
    marginRight: 6,
  },
  iconAmber: {
    fontSize: 12,
    color: '#D97706',
    marginRight: 6,
  },
  strengthText: {
    flex: 1,
    fontSize: 12,
    color: '#14532D',
  },
  limitationText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  countsRow: {
    flex: 1,
  },
  countsText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  detailsLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerActions: {
    marginTop: 10,
  },
});
