import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../tokens';
import { ParchmentCard } from './ParchmentCard';

interface QuestCardProps {
  readonly title: string;
  readonly detail: string;
  readonly status: 'ready' | 'planned';
}

export function QuestCard({ title, detail, status }: QuestCardProps) {
  const statusLabel = status === 'ready' ? 'Ready' : 'Planned';
  return (
    <ParchmentCard accessibilityLabel={`${title}, ${statusLabel}`}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>{statusLabel}</Text></View>
      </View>
    </ParchmentCard>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs },
  title: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  detail: { color: colors.mutedInk, fontSize: 14 },
  badge: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
});

