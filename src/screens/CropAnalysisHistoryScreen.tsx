import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { cropAnalysisService } from '../services/cropAnalysisService';
import { CropAnalysisHistoryRecord } from '../types/cropAnalysis';

interface Props {
  navigation: any;
}

export const CropAnalysisHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [historyList, setHistoryList] = useState<CropAnalysisHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await cropAnalysisService.getHistory();
      setHistoryList(data);
    } catch (err) {
      console.error('Failed to load crop analysis history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItem = async (item: CropAnalysisHistoryRecord) => {
    try {
      const parsedInput = JSON.parse(item.input_data);
      const parsedResult = JSON.parse(item.result_data);
      const crop = await cropAnalysisService.getCropByName(item.crop_name);

      if (crop) {
        navigation.navigate('CropAnalysisResult', {
          crop,
          userInput: parsedInput,
          result: parsedResult,
        });
      } else {
        Alert.alert('Crop Not Found', 'The crop data could not be retrieved from SQLite.');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to open past analysis: ' + e.message);
    }
  };

  const handleDeleteItem = (id: number, cropName: string) => {
    Alert.alert(
      'Delete Record',
      `Are you sure you want to remove the analysis for ${cropName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cropAnalysisService.deleteHistoryItem(id);
            loadHistory();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (historyList.length === 0) return;
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all saved crop analyses?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await cropAnalysisService.clearAllHistory();
            loadHistory();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: CropAnalysisHistoryRecord }) => {
    const dateStr = item.created_at
      ? new Date(item.created_at).toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '';

    const statusColor =
      item.status === 'Suitable'
        ? '#16A34A'
        : item.status === 'Moderately Suitable'
        ? '#D97706'
        : '#DC2626';

    const statusBg =
      item.status === 'Suitable'
        ? '#DCFCE7'
        : item.status === 'Moderately Suitable'
        ? '#FEF3C7'
        : '#FEE2E2';

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => handleOpenItem(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cropTitle}>🌾 {item.crop_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.scoreText}>
            Score: <Text style={{ fontWeight: '800', color: statusColor }}>{Math.round(item.score)}</Text> / 100
          </Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteItem(item.id, item.crop_name)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteBtnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        {/* Header Summary */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>📊 Saved Crop Analyses ({historyList.length})</Text>
          {historyList.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading saved analyses...</Text>
          </View>
        ) : historyList.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No Saved Analyses</Text>
            <Text style={styles.emptySubtitle}>
              Run a crop suitability evaluation and tap "Save Analysis" to view it here anytime offline.
            </Text>
          </View>
        ) : (
          <FlatList
            data={historyList}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  deleteBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
