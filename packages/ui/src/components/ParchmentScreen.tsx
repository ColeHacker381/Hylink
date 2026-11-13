import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../tokens';

interface ParchmentScreenProps extends PropsWithChildren {
  readonly title: string;
  readonly subtitle?: string;
}

export function ParchmentScreen({ children, title, subtitle }: ParchmentScreenProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.parchment, flex: 1 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 112 },
  heading: { gap: spacing.xs, paddingBottom: spacing.xs },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: 0.2 },
  subtitle: { color: colors.mutedInk, fontSize: 16, lineHeight: 23 },
});

