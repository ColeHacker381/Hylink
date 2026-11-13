import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { QuestOccurrenceStatus, QuestStatus } from '@hylink/domain';

import { colors, radius, spacing } from '../tokens';
import { ParchmentCard } from './ParchmentCard';

interface QuestCardProps {
  readonly title: string;
  readonly detail: string;
  readonly status: QuestStatus | QuestOccurrenceStatus;
  readonly onPress?: () => void;
  readonly onToggleComplete?: () => void;
  readonly mutationPending?: boolean;
}

export function QuestCard({ title, detail, status, onPress, onToggleComplete, mutationPending = false }: QuestCardProps) {
  const statusLabel = status[0]?.toUpperCase() + status.slice(1);
  const completed = status === 'completed';
  return (
    <ParchmentCard accessibilityLabel={`${title}, ${statusLabel}`}>
      <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>{statusLabel}</Text></View>
      </Pressable>
      {onToggleComplete ? (
        <Pressable accessibilityRole="button" disabled={mutationPending} onPress={onToggleComplete} style={[styles.action, mutationPending && styles.disabled]}>
          <Text style={styles.actionText}>{mutationPending ? 'Saving…' : completed ? 'Reopen' : 'Complete'}</Text>
        </Pressable>
      ) : null}
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
  action: { alignItems: 'center', alignSelf: 'flex-start', borderColor: colors.pine, borderRadius: radius.sm, borderWidth: 1.5, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.md },
  actionText: { color: colors.pine, fontWeight: '800' },
  disabled: { opacity: 0.5 },
});

