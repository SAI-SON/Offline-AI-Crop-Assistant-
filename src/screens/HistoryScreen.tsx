import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { PrimaryButton } from '../components/PrimaryButton';
import { historyService } from '../services/historyService';
import { parseLabel } from '../utils/labelParser';
import { ScanHistoryRecord } from '../types';

interface Props {
  navigation: any;
}

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [history, setHistory] = useState<ScanHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const items = await historyService.getScans();
      setHistory(items);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = (id: number, cropName: string) => {
    Alert.alert(
      Strings.common.delete,
      `Delete scan for ${cropName}?`,
      [
        { text: Strings.common.cancel, style: 'cancel' },
        {
          text: Strings.common.delete,
          style: 'destructive',
          onPress: async () => {
            await historyService.deleteScan(id);
            setHistory(prev => prev.filter(item => item.id !== id));
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (history.length === 0) return;
    Alert.alert(
      Strings.history.clearConfirmTitle,
      Strings.history.clearConfirmMessage,
      [
        { text: Strings.common.cancel, style: 'cancel' },
        {
          text: Strings.common.clearAll,
          style: 'destructive',
          onPress: async () => {
            await historyService.clearAllHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderItem = ({ item }: { item: ScanHistoryRecord }) => {
    const parsed = parseLabel(item.label);
    const pct = Math.round(item.confidence * 100);

    return (
      <View style={styles.historyCard}>
        <Image source={{ uri: item.image_uri }} style={styles.thumbnail} />

        <View style={styles.cardDetails}>
          <View style={styles.topRow}>
            <Text style={styles.cropTitle}>
              {parsed.emoji} {item.crop}
            </Text>
            <View
              style={[
                styles.confidenceBadge,
                parsed.isHealthy ? styles.badgeHealthy : styles.badgeDisease,
              ]}
            >
              <Text
                style={[
                  styles.confidenceText,
                  parsed.isHealthy ? styles.badgeTextHealthy : styles.badgeTextDisease,
                ]}
              >
                {pct}%
              </Text>
            </View>
          </View>

          <Text style={styles.diseaseTitle}>{item.disease}</Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id, item.crop)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Action Bar */}
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>{Strings.history.title}</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>{Strings.common.clearAll}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* List or Empty State */}
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyTitle}>{Strings.history.emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{Strings.history.emptySubtitle}</Text>
            <PrimaryButton
              title={Strings.home.scanLeaf}
              icon="📷"
              onPress={() => navigation.navigate('Camera')}
              style={{ marginTop: 24 }}
            />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={item => `${item.id}`}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearBtnText: {
    color: Colors.disease,
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeHealthy: {
    backgroundColor: Colors.healthyBg,
  },
  badgeDisease: {
    backgroundColor: Colors.diseaseBg,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeTextHealthy: {
    color: Colors.healthy,
  },
  badgeTextDisease: {
    color: Colors.disease,
  },
  diseaseTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
