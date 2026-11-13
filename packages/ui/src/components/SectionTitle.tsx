import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../tokens';

interface SectionTitleProps extends PropsWithChildren {
  readonly eyebrow?: string;
}

export function SectionTitle({ children, eyebrow }: SectionTitleProps) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  eyebrow: { color: colors.pine, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.ink, fontSize: 21, fontWeight: '800' },
});

