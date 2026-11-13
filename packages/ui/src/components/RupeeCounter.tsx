import { formatRupees } from '@hylink/domain';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../tokens';

export function RupeeCounter({ value }: { readonly value: number }) {
  const label = formatRupees(value);
  return (
    <View accessibilityLabel={label} style={styles.container}>
      <View style={styles.gem} />
      <Text style={styles.value}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  gem: { backgroundColor: colors.accent, borderColor: colors.pine, borderRadius: radius.sm, borderWidth: 2, height: 20, transform: [{ rotate: '45deg' }], width: 20 },
  value: { color: colors.pine, fontSize: 22, fontWeight: '900' },
});

