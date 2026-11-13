import { clampPercent } from '@hylink/domain';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../tokens';

interface GoldProgressBarProps {
  readonly label: string;
  readonly value: number;
}

export function GoldProgressBar({ label, value }: GoldProgressBarProps) {
  const safeValue = clampPercent(value);

  return (
    <View accessibilityLabel={`${label}: ${safeValue}%`} accessibilityRole="progressbar" style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{safeValue}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${safeValue}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, marginTop: spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.ink, fontWeight: '600' },
  value: { color: colors.pine, fontWeight: '800' },
  track: { backgroundColor: colors.parchment, borderRadius: radius.pill, height: 12, overflow: 'hidden' },
  fill: { backgroundColor: colors.gold, borderRadius: radius.pill, height: '100%' },
});

