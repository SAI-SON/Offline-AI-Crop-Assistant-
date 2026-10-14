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
  StatusBar,
} from 'react-native';
import { Colors } from '../constants/colors';
import { cropAnalysisService } from '../services/cropAnalysisService';
import { CropRequirement } from '../types/cropAnalysis';

interface Props {
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

export const CropAnalysisScreen: React.FC<Props> = ({ navigation }) => {
  const [crops, setCrops] = useState<CropRequirement[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<CropRequirement[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    try {
      setLoading(true);
      const data = await cropAnalysisService.getAllCrops();
      setCrops(data);
      setFilteredCrops(data);
    } catch (err) {
      console.error('Failed to load crops from SQLite:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredCrops(crops);
      return;
    }
    const q = text.toLowerCase().trim();
    const filtered = crops.filter(
      c =>
        c.crop_name.toLowerCase().includes(q) ||
        (c.season && c.season.toLowerCase().includes(q)) ||
        (c.soil_texture && c.soil_texture.toLowerCase().includes(q))
    );
    setFilteredCrops(filtered);
  };

  const handleSelectCrop = (crop: CropRequirement) => {
    navigation.navigate('CropAnalysisInput', {
      cropId: crop.id,
      cropName: crop.crop_name,
      crop,
    });
  };

  const renderCropItem = ({ item }: { item: CropRequirement }) => {
    const emoji = CROP_EMOJIS[item.crop_name] || '🌿';

    return (
      <TouchableOpacity
        style={styles.cropCard}
        onPress={() => handleSelectCrop(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cropEmoji}>{emoji}</Text>
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>{item.crop_name}</Text>
            {item.season ? (
              <View style={styles.seasonBadge}>
                <Text style={styles.seasonText}>🗓 {item.season}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.sourceTag}>
            <Text style={styles.sourceTagText}>{item.source || 'TNAU'}</Text>
          </View>
        </View>

        {item.soil_texture ? (
          <Text style={styles.soilNote} numberOfLines={2}>
            🌱 <Text style={{ fontWeight: '600' }}>Soil:</Text> {item.soil_texture}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.waterDemand}>
            <Text style={styles.waterLabel}>Water demand:</Text>
            <Text
              style={[
                styles.waterValue,
                item.water_requirement === 'High'
                  ? styles.waterHigh
                  : item.water_requirement === 'Low'
                  ? styles.waterLow
                  : styles.waterMedium,
              ]}
            >
              💧 {item.water_requirement || 'Medium'}
            </Text>
          </View>
          <Text style={styles.selectArrow}>Select →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        {/* Banner / Info Bar */}
        <View style={styles.infoBanner}>
          <Text style={styles.bannerTitle}>🌾 Select a Crop to Analyze</Text>
          <Text style={styles.bannerSubtitle}>
            Determine how well your local soil and environmental conditions match the crop's physiological requirements.
          </Text>
          <View style={styles.bannerButtonsRow}>
            <TouchableOpacity
              style={styles.recommendBtn}
              onPress={() => navigation.navigate('CropRecommendationInput')}
            >
              <Text style={styles.recommendBtnText}>🧪 Recommend by Soil →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => navigation.navigate('CropAnalysisHistory')}
            >
              <Text style={styles.historyBtnText}>📊 Past History →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop by name, season, or soil..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Crop List from SQLite */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading crops from cropcare.db...</Text>
          </View>
        ) : filteredCrops.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyIcon}>🌾</Text>
            <Text style={styles.emptyText}>No matching crops found in database.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCrops}
            keyExtractor={item => String(item.id)}
            renderItem={renderCropItem}
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
  infoBanner: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#D0E8D4',
    marginTop: 4,
    lineHeight: 18,
  },
  bannerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  recommendBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  recommendBtnText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '800',
  },
  historyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  historyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 14,
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
    paddingTop: 6,
    paddingBottom: 32,
  },
  cropCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  seasonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
  },
  seasonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  sourceTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sourceTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  soilNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  waterDemand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 6,
  },
  waterValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  waterHigh: {
    color: '#0284C7',
  },
  waterMedium: {
    color: '#0D9488',
  },
  waterLow: {
    color: '#D97706',
  },
  selectArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
