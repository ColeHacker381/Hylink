import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, spacing } from '../tokens';

type ParchmentCardProps = PropsWithChildren<Pick<ViewProps, 'accessibilityLabel'>>;

export function ParchmentCard({ accessibilityLabel, children }: ParchmentCardProps) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.card}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.parchmentLight,
    borderColor: colors.bronze,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
});

