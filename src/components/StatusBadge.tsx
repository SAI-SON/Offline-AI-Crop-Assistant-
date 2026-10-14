import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  modelReady?: boolean;
  dbReady?: boolean;
  offlineMode?: boolean;
}

export const StatusBadge: React.FC<Props> = ({
  modelReady = true,
  dbReady = true,
  offlineMode = true,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Offline Mode */}
      {offlineMode && (
        <View style={styles.badge}>
          <View style={[styles.dot, { backgroundColor: Colors.primaryLight }]} />
          <Text style={styles.badgeText}>Offline Mode</Text>
        </View>
      )}

      {/* 2. AI Model Ready */}
      <View style={[styles.badge, modelReady ? styles.badgeModelOk : styles.badgeError]}>
        <View style={[styles.dot, { backgroundColor: modelReady ? '#0288D1' : '#D32F2F' }]} />
        <Text style={[styles.badgeText, { color: modelReady ? '#0277BD' : '#C62828' }]}>
          {modelReady ? 'AI Model Ready' : 'AI Loading...'}
        </Text>
      </View>

      {/* 3. Local Database Ready */}
      <View style={[styles.badge, dbReady ? styles.badgeDbOk : styles.badgeError]}>
        <View style={[styles.dot, { backgroundColor: dbReady ? '#7B1FA2' : '#D32F2F' }]} />
        <Text style={[styles.badgeText, { color: dbReady ? '#6A1B9A' : '#C62828' }]}>
          {dbReady ? 'SQLite DB Ready' : 'DB Loading...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  badgeModelOk: {
    backgroundColor: '#E1F5FE',
    borderColor: '#B3E5FC',
  },
  badgeDbOk: {
    backgroundColor: '#F3E5F5',
    borderColor: '#E1BEE7',
  },
  badgeError: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B5E20',
  },
});
