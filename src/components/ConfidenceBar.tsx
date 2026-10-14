import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { assessConfidence } from '../utils/confidence';

interface Props {
  confidence: number; // 0.0 - 1.0
  showLabel?: boolean;
}

export const ConfidenceBar: React.FC<Props> = ({ confidence, showLabel = true }) => {
  const assessment = assessConfidence(confidence);
  const percentWidth = Math.max(4, Math.min(100, Math.round(assessment.score * 100)));

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.headerRow}>
          <Text style={styles.label}>AI Confidence</Text>
          <Text style={[styles.percentage, { color: assessment.color }]}>
            {assessment.percentageText}
          </Text>
        </View>
      )}

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentWidth}%`,
              backgroundColor: assessment.color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5D4E',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '800',
  },
  track: {
    height: 10,
    backgroundColor: '#E8EFE8',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
});
